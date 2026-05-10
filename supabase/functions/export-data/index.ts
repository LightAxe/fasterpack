import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as fflate from "https://esm.sh/fflate@0.8.2";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  if (/^https:\/\/(www\.)?fasterpack\.net$/i.test(origin)) {
    return true;
  }

  if (/^http:\/\/localhost:\d+$/.test(origin)) {
    return true;
  }

  return false;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin');
  const allowedOrigin = isAllowedOrigin(origin) ? origin : null;

  return {
    "Access-Control-Allow-Origin": allowedOrigin || "",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}

// Helper to convert array of objects to CSV
function arrayToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        let stringValue = typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
        // Prevent CSV formula injection by prefixing with single quote
        if (/^[=+\-@\t\r]/.test(stringValue)) {
          stringValue = "'" + stringValue;
        }
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(",")
    )
  ];

  return csvRows.join("\n");
}

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

interface ExportData {
  exportedAt: string;
  user: { id: string; role: string };
  profile: Record<string, unknown> | null;
  teamMemberships?: Record<string, unknown>[];
  workoutLogs?: Record<string, unknown>[];
  raceResults?: Record<string, unknown>[];
  attendance?: Record<string, unknown>[];
  // Coach-specific
  teams?: Record<string, unknown>[];
  teamAthletes?: Record<string, unknown>[];
  scheduledWorkouts?: Record<string, unknown>[];
  workoutTemplates?: Record<string, unknown>[];
  announcements?: Record<string, unknown>[];
  auditLogs?: Record<string, unknown>[];
  seasons?: Record<string, unknown>[];
  races?: Record<string, unknown>[];
  // Parent-specific
  linkedChildren?: Record<string, unknown>[];
  childrenWorkoutLogs?: Record<string, unknown>[];
  childrenRaceResults?: Record<string, unknown>[];
  childrenAttendance?: Record<string, unknown>[];
}

async function getAthleteData(supabase: SupabaseClient, userId: string): Promise<Partial<ExportData>> {
  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Get team memberships with team names
  const { data: teamMemberships } = await supabase
    .from("team_memberships")
    .select("*, teams(name)")
    .eq("profile_id", userId);

  // Get team_athlete IDs for this user
  const { data: teamAthleteRecords } = await supabase
    .from("team_athletes")
    .select("id")
    .eq("profile_id", userId);

  const teamAthleteIds = (teamAthleteRecords || []).map((ta: { id: string }) => ta.id);

  // Get workout logs with scheduled workout details
  let workoutLogs: Record<string, unknown>[] = [];
  if (teamAthleteIds.length > 0) {
    const { data: logs } = await supabase
      .from("workout_logs")
      .select("*, scheduled_workouts(title, type, scheduled_date)")
      .in("team_athlete_id", teamAthleteIds);
    workoutLogs = logs || [];
  }

  // Get race results with race and distance details
  let raceResults: Record<string, unknown>[] = [];
  if (teamAthleteIds.length > 0) {
    const { data: results } = await supabase
      .from("race_results")
      .select("*, races(name, race_date), distances(name)")
      .in("team_athlete_id", teamAthleteIds);
    raceResults = results || [];
  }

  // Get attendance records
  let attendance: Record<string, unknown>[] = [];
  if (teamAthleteIds.length > 0) {
    const { data: records } = await supabase
      .from("attendance")
      .select("*")
      .in("team_athlete_id", teamAthleteIds)
      .order("date", { ascending: false });
    attendance = records || [];
  }

  return {
    profile,
    teamMemberships: (teamMemberships || []).map((tm: Record<string, unknown>) => ({
      ...tm,
      team_name: (tm.teams as { name: string } | null)?.name,
      teams: undefined,
    })),
    workoutLogs: workoutLogs.map((wl: Record<string, unknown>) => ({
      ...wl,
      workout_title: (wl.scheduled_workouts as { title: string } | null)?.title,
      workout_type: (wl.scheduled_workouts as { type: string } | null)?.type,
      workout_date: (wl.scheduled_workouts as { scheduled_date: string } | null)?.scheduled_date,
      scheduled_workouts: undefined,
    })),
    raceResults: raceResults.map((rr: Record<string, unknown>) => ({
      ...rr,
      race_name: (rr.races as { name: string } | null)?.name,
      race_date: (rr.races as { race_date: string } | null)?.race_date,
      distance_name: (rr.distances as { name: string } | null)?.name,
      races: undefined,
      distances: undefined,
    })),
    attendance,
  };
}

async function getCoachData(supabase: SupabaseClient, userId: string): Promise<Partial<ExportData>> {
  // Start with athlete data for the coach's own profile
  const athleteData = await getAthleteData(supabase, userId);

  // Get teams owned by this coach
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("created_by", userId);

  const teamIds = (teams || []).map((t: { id: string }) => t.id);

  if (teamIds.length === 0) {
    return {
      ...athleteData,
      teams: [],
      teamAthletes: [],
      scheduledWorkouts: [],
      workoutTemplates: [],
      announcements: [],
      auditLogs: [],
      seasons: [],
      races: [],
      attendance: [],
    };
  }

  // Get all team athletes for owned teams
  const { data: teamAthletes } = await supabase
    .from("team_athletes")
    .select("*, teams(name)")
    .in("team_id", teamIds);

  // Get all scheduled workouts for owned teams
  const { data: scheduledWorkouts } = await supabase
    .from("scheduled_workouts")
    .select("*")
    .in("team_id", teamIds);

  // Get all workout templates for owned teams
  const { data: workoutTemplates } = await supabase
    .from("workout_templates")
    .select("*")
    .in("team_id", teamIds);

  // Get all announcements for owned teams
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .in("team_id", teamIds);

  // Get all audit logs for owned teams
  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("*")
    .in("team_id", teamIds);

  // Get all seasons for owned teams
  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .in("team_id", teamIds);

  // Get all races for owned teams
  const { data: races } = await supabase
    .from("races")
    .select("*, distances(name)")
    .in("team_id", teamIds);

  // Get all workout logs for owned teams
  const teamAthleteIds = (teamAthletes || []).map((ta: { id: string }) => ta.id);
  let allWorkoutLogs: Record<string, unknown>[] = [];
  if (teamAthleteIds.length > 0) {
    const { data: logs } = await supabase
      .from("workout_logs")
      .select("*, scheduled_workouts(title, type, scheduled_date)")
      .in("team_athlete_id", teamAthleteIds);
    allWorkoutLogs = logs || [];
  }

  // Get all race results for owned teams
  let allRaceResults: Record<string, unknown>[] = [];
  if (teamAthleteIds.length > 0) {
    const { data: results } = await supabase
      .from("race_results")
      .select("*, races(name, race_date), distances(name)")
      .in("team_athlete_id", teamAthleteIds);
    allRaceResults = results || [];
  }

  // Get all attendance records for owned teams
  let allAttendance: Record<string, unknown>[] = [];
  if (teamIds.length > 0) {
    const { data: records } = await supabase
      .from("attendance")
      .select("*, team_athletes(first_name, last_name)")
      .in("team_id", teamIds)
      .order("date", { ascending: false });
    allAttendance = records || [];
  }

  return {
    ...athleteData,
    // Override workout logs and race results with full team data
    workoutLogs: allWorkoutLogs.map((wl: Record<string, unknown>) => ({
      ...wl,
      workout_title: (wl.scheduled_workouts as { title: string } | null)?.title,
      workout_type: (wl.scheduled_workouts as { type: string } | null)?.type,
      workout_date: (wl.scheduled_workouts as { scheduled_date: string } | null)?.scheduled_date,
      scheduled_workouts: undefined,
    })),
    raceResults: allRaceResults.map((rr: Record<string, unknown>) => ({
      ...rr,
      race_name: (rr.races as { name: string } | null)?.name,
      race_date: (rr.races as { race_date: string } | null)?.race_date,
      distance_name: (rr.distances as { name: string } | null)?.name,
      races: undefined,
      distances: undefined,
    })),
    teams,
    teamAthletes: (teamAthletes || []).map((ta: Record<string, unknown>) => ({
      ...ta,
      team_name: (ta.teams as { name: string } | null)?.name,
      teams: undefined,
    })),
    scheduledWorkouts,
    workoutTemplates,
    announcements,
    auditLogs,
    seasons,
    races: (races || []).map((r: Record<string, unknown>) => ({
      ...r,
      distance_name: (r.distances as { name: string } | null)?.name,
      distances: undefined,
    })),
    attendance: allAttendance.map((a: Record<string, unknown>) => ({
      ...a,
      athlete_first_name: (a.team_athletes as { first_name: string } | null)?.first_name,
      athlete_last_name: (a.team_athletes as { last_name: string } | null)?.last_name,
      team_athletes: undefined,
    })),
  };
}

async function getParentData(supabase: SupabaseClient, userId: string): Promise<Partial<ExportData>> {
  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Get linked children
  const { data: parentLinks } = await supabase
    .from("parent_athlete_links")
    .select("*, team_athletes(id, first_name, last_name, team_id), teams:team_athletes(teams(name))")
    .eq("parent_id", userId);

  const linkedChildren = (parentLinks || []).map((link: Record<string, unknown>) => {
    const athlete = link.team_athletes as { id: string; first_name: string; last_name: string; team_id: string } | null;
    const teamsData = link.teams as { teams: { name: string } | null } | null;
    return {
      link_id: link.id,
      team_athlete_id: athlete?.id,
      first_name: athlete?.first_name,
      last_name: athlete?.last_name,
      team_id: athlete?.team_id,
      team_name: teamsData?.teams?.name,
      created_at: link.created_at,
    };
  });

  const childAthleteIds = linkedChildren
    .map((c: { team_athlete_id?: string }) => c.team_athlete_id)
    .filter(Boolean) as string[];

  // Get workout logs for linked children
  let childrenWorkoutLogs: Record<string, unknown>[] = [];
  if (childAthleteIds.length > 0) {
    const { data: logs } = await supabase
      .from("workout_logs")
      .select("*, scheduled_workouts(title, type, scheduled_date), team_athletes(first_name, last_name)")
      .in("team_athlete_id", childAthleteIds);
    childrenWorkoutLogs = (logs || []).map((wl: Record<string, unknown>) => ({
      ...wl,
      workout_title: (wl.scheduled_workouts as { title: string } | null)?.title,
      workout_type: (wl.scheduled_workouts as { type: string } | null)?.type,
      workout_date: (wl.scheduled_workouts as { scheduled_date: string } | null)?.scheduled_date,
      athlete_first_name: (wl.team_athletes as { first_name: string } | null)?.first_name,
      athlete_last_name: (wl.team_athletes as { last_name: string } | null)?.last_name,
      scheduled_workouts: undefined,
      team_athletes: undefined,
    }));
  }

  // Get race results for linked children
  let childrenRaceResults: Record<string, unknown>[] = [];
  if (childAthleteIds.length > 0) {
    const { data: results } = await supabase
      .from("race_results")
      .select("*, races(name, race_date), distances(name), team_athletes(first_name, last_name)")
      .in("team_athlete_id", childAthleteIds);
    childrenRaceResults = (results || []).map((rr: Record<string, unknown>) => ({
      ...rr,
      race_name: (rr.races as { name: string } | null)?.name,
      race_date: (rr.races as { race_date: string } | null)?.race_date,
      distance_name: (rr.distances as { name: string } | null)?.name,
      athlete_first_name: (rr.team_athletes as { first_name: string } | null)?.first_name,
      athlete_last_name: (rr.team_athletes as { last_name: string } | null)?.last_name,
      races: undefined,
      distances: undefined,
      team_athletes: undefined,
    }));
  }

  // Get attendance for linked children
  let childrenAttendance: Record<string, unknown>[] = [];
  if (childAthleteIds.length > 0) {
    const { data: records } = await supabase
      .from("attendance")
      .select("*, team_athletes(first_name, last_name)")
      .in("team_athlete_id", childAthleteIds)
      .order("date", { ascending: false });
    childrenAttendance = (records || []).map((a: Record<string, unknown>) => ({
      ...a,
      athlete_first_name: (a.team_athletes as { first_name: string } | null)?.first_name,
      athlete_last_name: (a.team_athletes as { last_name: string } | null)?.last_name,
      team_athletes: undefined,
    }));
  }

  return {
    profile,
    linkedChildren,
    childrenWorkoutLogs,
    childrenRaceResults,
    childrenAttendance,
  };
}

function createZipFile(data: ExportData, role: string): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  const encoder = new TextEncoder();

  // Profile (all roles)
  if (data.profile) {
    files["profile.csv"] = encoder.encode(arrayToCSV([data.profile]));
  }

  if (role === "athlete") {
    if (data.teamMemberships?.length) {
      files["team_memberships.csv"] = encoder.encode(arrayToCSV(data.teamMemberships));
    }
    if (data.workoutLogs?.length) {
      files["workout_logs.csv"] = encoder.encode(arrayToCSV(data.workoutLogs));
    }
    if (data.raceResults?.length) {
      files["race_results.csv"] = encoder.encode(arrayToCSV(data.raceResults));
    }
    if (data.attendance?.length) {
      files["attendance.csv"] = encoder.encode(arrayToCSV(data.attendance));
    }
  } else if (role === "coach") {
    if (data.teamMemberships?.length) {
      files["team_memberships.csv"] = encoder.encode(arrayToCSV(data.teamMemberships));
    }
    if (data.teams?.length) {
      files["teams.csv"] = encoder.encode(arrayToCSV(data.teams));
    }
    if (data.teamAthletes?.length) {
      files["team_athletes.csv"] = encoder.encode(arrayToCSV(data.teamAthletes));
    }
    if (data.scheduledWorkouts?.length) {
      files["scheduled_workouts.csv"] = encoder.encode(arrayToCSV(data.scheduledWorkouts));
    }
    if (data.workoutLogs?.length) {
      files["workout_logs.csv"] = encoder.encode(arrayToCSV(data.workoutLogs));
    }
    if (data.workoutTemplates?.length) {
      files["workout_templates.csv"] = encoder.encode(arrayToCSV(data.workoutTemplates));
    }
    if (data.raceResults?.length) {
      files["race_results.csv"] = encoder.encode(arrayToCSV(data.raceResults));
    }
    if (data.races?.length) {
      files["races.csv"] = encoder.encode(arrayToCSV(data.races));
    }
    if (data.seasons?.length) {
      files["seasons.csv"] = encoder.encode(arrayToCSV(data.seasons));
    }
    if (data.announcements?.length) {
      files["announcements.csv"] = encoder.encode(arrayToCSV(data.announcements));
    }
    if (data.auditLogs?.length) {
      files["audit_logs.csv"] = encoder.encode(arrayToCSV(data.auditLogs));
    }
    if (data.attendance?.length) {
      files["attendance.csv"] = encoder.encode(arrayToCSV(data.attendance));
    }
  } else if (role === "parent") {
    if (data.linkedChildren?.length) {
      files["linked_children.csv"] = encoder.encode(arrayToCSV(data.linkedChildren));
    }
    if (data.childrenWorkoutLogs?.length) {
      files["children_workout_logs.csv"] = encoder.encode(arrayToCSV(data.childrenWorkoutLogs));
    }
    if (data.childrenRaceResults?.length) {
      files["children_race_results.csv"] = encoder.encode(arrayToCSV(data.childrenRaceResults));
    }
    if (data.childrenAttendance?.length) {
      files["children_attendance.csv"] = encoder.encode(arrayToCSV(data.childrenAttendance));
    }
  }

  // Create ZIP
  return fflate.zipSync(files);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables not configured");
    }

    // Get auth token from header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    const token = authHeader.replace("Bearer ", "");

    // Create client with user's token to verify identity
    const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "");
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Parse request body
    const { format } = await req.json();
    if (!format || !["json", "csv"].includes(format)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid format. Use 'json' or 'csv'" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create service role client for data access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user's profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: "Profile not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const role = profile.role as string;
    let exportData: Partial<ExportData>;

    // Collect data based on role
    if (role === "coach") {
      exportData = await getCoachData(supabase, user.id);
    } else if (role === "parent") {
      exportData = await getParentData(supabase, user.id);
    } else {
      // Default to athlete
      exportData = await getAthleteData(supabase, user.id);
    }

    // Build final export object
    const finalExport: ExportData = {
      exportedAt: new Date().toISOString(),
      user: { id: user.id, role },
      profile: exportData.profile || null,
      ...exportData,
    };

    // Generate filename with date
    const dateStr = new Date().toISOString().split("T")[0];

    if (format === "json") {
      return new Response(JSON.stringify(finalExport, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="training-hub-export-${dateStr}.json"`,
          ...corsHeaders,
        },
      });
    } else {
      // CSV format - create ZIP
      const zipData = createZipFile(finalExport, role);

      return new Response(zipData as unknown as ArrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="training-hub-export-${dateStr}.zip"`,
          ...corsHeaders,
        },
      });
    }
  } catch (error: unknown) {
    console.error("Error in export-data function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      }
    );
  }
});
