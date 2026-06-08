import { getStoredSession, supabaseEnv } from "./supabaseClient.js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

const COURSES_TABLE = "profile_cabinet_courses";
const COURSE_STEPS_TABLE = "profile_cabinet_course_steps";
const COURSE_LESSONS_TABLE = "profile_cabinet_course_lessons";
const COURSE_ACCESS_TABLE = "profile_cabinet_course_access";
const PROFILES_TABLE = "profile_cabinet_profiles";

const COURSE_FIELDS = "id,slug,title,description,cover_url,status,position,created_at,updated_at";
const COURSE_STEP_FIELDS = "id,course_id,title,description,position,status,created_at,updated_at";
const COURSE_LESSON_FIELDS = "id,course_id,step_id,title,body,video_url,audio_url,position,status,created_at,updated_at";
const COURSE_ACCESS_FIELDS = "id,profile_id,user_id,course_id,step_id,access_scope,status,created_at,updated_at";
const COURSE_ACCESS_ADMIN_FIELDS = [
  COURSE_ACCESS_FIELDS,
  "profile_cabinet_profiles(id,user_id,display_name,city,country,status)",
  "profile_cabinet_courses(id,title,status)",
  "profile_cabinet_course_steps(id,title,status)"
].join(",");

export const COURSE_STATUSES = [
  { value: "draft", label: "Черновик" },
  { value: "published", label: "Опубликован" },
  { value: "archived", label: "Архив" }
];

export const COURSE_ACCESS_SCOPES = [
  { value: "course", label: "Весь курс" },
  { value: "step", label: "Конкретная ступень" }
];

export const COURSE_ACCESS_STATUSES = [
  { value: "active", label: "Активен" },
  { value: "revoked", label: "Закрыт" }
];

function makeError(message, details = null) {
  const error = new Error(message);
  error.details = details;
  return error;
}

function text(value) {
  return String(value || "").trim();
}

function nullableText(value) {
  const normalized = text(value);
  return normalized || null;
}

function integer(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : 0;
}

function courseStatus(value) {
  return COURSE_STATUSES.some((status) => status.value === value) ? value : "draft";
}

function accessScope(value) {
  return COURSE_ACCESS_SCOPES.some((scope) => scope.value === value) ? value : "step";
}

function accessStatus(value) {
  return COURSE_ACCESS_STATUSES.some((status) => status.value === value) ? value : "active";
}

function csvIn(values = []) {
  return values.map(text).filter(Boolean).join(",");
}

function requireSession(session, message = "Нужно войти в кабинет.") {
  if (!session?.access_token) throw makeError(message);
}

export function createEmptyCourseForm(overrides = {}) {
  return {
    id: "",
    slug: "",
    title: "",
    description: "",
    cover_url: "",
    status: "draft",
    position: 0,
    ...overrides
  };
}

export function createEmptyCourseStepForm(overrides = {}) {
  return {
    id: "",
    course_id: "",
    title: "",
    description: "",
    status: "draft",
    position: 0,
    ...overrides
  };
}

export function createEmptyCourseLessonForm(overrides = {}) {
  return {
    id: "",
    course_id: "",
    step_id: "",
    title: "",
    body: "",
    video_url: "",
    audio_url: "",
    status: "draft",
    position: 0,
    ...overrides
  };
}

export function normalizeCourseForm(form = {}, requestedStatus = form?.status) {
  return {
    slug: nullableText(form.slug),
    title: text(form.title),
    description: text(form.description),
    cover_url: text(form.cover_url),
    status: courseStatus(requestedStatus),
    position: integer(form.position)
  };
}

export function normalizeCourseStepForm(form = {}, requestedStatus = form?.status) {
  return {
    course_id: text(form.course_id),
    title: text(form.title),
    description: text(form.description),
    status: courseStatus(requestedStatus),
    position: integer(form.position)
  };
}

export function normalizeCourseLessonForm(form = {}, requestedStatus = form?.status) {
  return {
    course_id: text(form.course_id),
    step_id: text(form.step_id),
    title: text(form.title),
    body: text(form.body),
    video_url: text(form.video_url),
    audio_url: text(form.audio_url),
    status: courseStatus(requestedStatus),
    position: integer(form.position)
  };
}

export function normalizeCourseAccessForm(form = {}) {
  const scope = accessScope(form.access_scope || form.accessScope);
  const stepId = text(form.step_id || form.stepId);
  return {
    profile_id: text(form.profile_id || form.profileId),
    user_id: nullableText(form.user_id || form.userId),
    course_id: text(form.course_id || form.courseId),
    step_id: scope === "course" ? null : stepId,
    access_scope: scope,
    status: accessStatus(form.status)
  };
}

export function courseStatusText(status) {
  return COURSE_STATUSES.find((item) => item.value === status)?.label || "Черновик";
}

export function courseAccessScopeText(scope) {
  return COURSE_ACCESS_SCOPES.find((item) => item.value === scope)?.label || "Конкретная ступень";
}

export function courseAccessStatusText(status) {
  return COURSE_ACCESS_STATUSES.find((item) => item.value === status)?.label || "Активен";
}

export function buildCourseAccessIndex(accessRows = []) {
  const fullCourseIds = new Set();
  const stepIdsByCourseId = new Map();

  for (const row of accessRows || []) {
    if (row?.status !== "active") continue;
    const courseId = text(row.course_id);
    const stepId = text(row.step_id);
    if (!courseId) continue;

    if (row.access_scope === "course" && !stepId) {
      fullCourseIds.add(courseId);
      continue;
    }

    if (row.access_scope === "step" && stepId) {
      if (!stepIdsByCourseId.has(courseId)) stepIdsByCourseId.set(courseId, new Set());
      stepIdsByCourseId.get(courseId).add(stepId);
    }
  }

  return { fullCourseIds, stepIdsByCourseId };
}

function normalizeCourseRow(row = {}) {
  return {
    ...createEmptyCourseForm(row),
    id: text(row.id),
    slug: text(row.slug),
    title: text(row.title),
    description: text(row.description),
    cover_url: text(row.cover_url),
    status: courseStatus(row.status),
    position: integer(row.position),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function normalizeCourseStepRow(row = {}) {
  return {
    ...createEmptyCourseStepForm(row),
    id: text(row.id),
    course_id: text(row.course_id),
    title: text(row.title),
    description: text(row.description),
    status: courseStatus(row.status),
    position: integer(row.position),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function normalizeCourseLessonRow(row = {}) {
  return {
    ...createEmptyCourseLessonForm(row),
    id: text(row.id),
    course_id: text(row.course_id),
    step_id: text(row.step_id),
    title: text(row.title),
    body: text(row.body),
    video_url: text(row.video_url),
    audio_url: text(row.audio_url),
    status: courseStatus(row.status),
    position: integer(row.position),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function normalizeCourseAccessRow(row = {}) {
  return {
    id: text(row.id),
    profile_id: text(row.profile_id),
    user_id: text(row.user_id),
    course_id: text(row.course_id),
    step_id: text(row.step_id),
    access_scope: accessScope(row.access_scope),
    status: accessStatus(row.status),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    profile: row.profile_cabinet_profiles || row.profile || null,
    course: row.profile_cabinet_courses || row.course || null,
    step: row.profile_cabinet_course_steps || row.step || null
  };
}

async function request(path, options = {}) {
  if (!supabaseEnv.isConfigured) throw makeError("Курсы требуют настройки подключения Supabase.");
  const session = options.session || getStoredSession();
  const token = options.publicRequest ? SUPABASE_ANON_KEY : session?.access_token;
  if (!options.publicRequest && !token) throw makeError("Auth required.");

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;
  if (!response.ok) throw makeError(data?.msg || data?.message || "Courses request failed.", { ...(data || {}), status: response.status });
  return data;
}

export async function listAdminCourses(session = getStoredSession()) {
  requireSession(session, "Нужен вход администратора.");
  const rows = await request(`/rest/v1/${COURSES_TABLE}?select=${COURSE_FIELDS}&order=position.asc&order=created_at.desc`, { session });
  return Array.isArray(rows) ? rows.map(normalizeCourseRow) : [];
}

export async function createCourse(course, session = getStoredSession()) {
  requireSession(session, "Нужен вход администратора.");
  const rows = await request(`/rest/v1/${COURSES_TABLE}`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body: normalizeCourseForm(course, course?.status)
  });
  return rows?.[0] ? normalizeCourseRow(rows[0]) : null;
}

export async function updateCourse(courseId, patch, session = getStoredSession()) {
  requireSession(session, "Нужен вход администратора.");
  if (!courseId) throw makeError("Missing course id.");
  const rows = await request(`/rest/v1/${COURSES_TABLE}?id=eq.${encodeURIComponent(courseId)}`, {
    method: "PATCH",
    session,
    prefer: "return=representation",
    body: { ...normalizeCourseForm(patch, patch?.status), updated_at: new Date().toISOString() }
  });
  return rows?.[0] ? normalizeCourseRow(rows[0]) : null;
}

export async function listAdminCourseSteps(courseId, session = getStoredSession()) {
  requireSession(session, "Нужен вход администратора.");
  if (!courseId) return [];
  const rows = await request(`/rest/v1/${COURSE_STEPS_TABLE}?course_id=eq.${encodeURIComponent(courseId)}&select=${COURSE_STEP_FIELDS}&order=position.asc&order=created_at.asc`, { session });
  return Array.isArray(rows) ? rows.map(normalizeCourseStepRow) : [];
}

export async function createCourseStep(step, session = getStoredSession()) {
  requireSession(session, "Нужен вход администратора.");
  const rows = await request(`/rest/v1/${COURSE_STEPS_TABLE}`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body: normalizeCourseStepForm(step, step?.status)
  });
  return rows?.[0] ? normalizeCourseStepRow(rows[0]) : null;
}

export async function updateCourseStep(stepId, patch, session = getStoredSession()) {
  requireSession(session, "Нужен вход администратора.");
  if (!stepId) throw makeError("Missing course step id.");
  const rows = await request(`/rest/v1/${COURSE_STEPS_TABLE}?id=eq.${encodeURIComponent(stepId)}`, {
    method: "PATCH",
    session,
    prefer: "return=representation",
    body: { ...normalizeCourseStepForm(patch, patch?.status), updated_at: new Date().toISOString() }
  });
  return rows?.[0] ? normalizeCourseStepRow(rows[0]) : null;
}

export async function listAdminCourseLessons(courseId, stepId, session = getStoredSession()) {
  requireSession(session, "Нужен вход администратора.");
  if (!courseId || !stepId) return [];
  const rows = await request(
    `/rest/v1/${COURSE_LESSONS_TABLE}?course_id=eq.${encodeURIComponent(courseId)}&step_id=eq.${encodeURIComponent(stepId)}&select=${COURSE_LESSON_FIELDS}&order=position.asc&order=created_at.asc`,
    { session }
  );
  return Array.isArray(rows) ? rows.map(normalizeCourseLessonRow) : [];
}

export async function createCourseLesson(lesson, session = getStoredSession()) {
  requireSession(session, "Нужен вход администратора.");
  const rows = await request(`/rest/v1/${COURSE_LESSONS_TABLE}`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body: normalizeCourseLessonForm(lesson, lesson?.status)
  });
  return rows?.[0] ? normalizeCourseLessonRow(rows[0]) : null;
}

export async function updateCourseLesson(lessonId, patch, session = getStoredSession()) {
  requireSession(session, "Нужен вход администратора.");
  if (!lessonId) throw makeError("Missing course lesson id.");
  const rows = await request(`/rest/v1/${COURSE_LESSONS_TABLE}?id=eq.${encodeURIComponent(lessonId)}`, {
    method: "PATCH",
    session,
    prefer: "return=representation",
    body: { ...normalizeCourseLessonForm(patch, patch?.status), updated_at: new Date().toISOString() }
  });
  return rows?.[0] ? normalizeCourseLessonRow(rows[0]) : null;
}

export async function listCourseAccessProfiles(session = getStoredSession()) {
  requireSession(session, "Нужен вход администратора.");
  const fields = "id,user_id,display_name,city,country,status,updated_at";
  const rows = await request(`/rest/v1/${PROFILES_TABLE}?status=eq.approved&select=${fields}&order=display_name.asc&order=updated_at.desc`, { session });
  return Array.isArray(rows) ? rows : [];
}

export async function listAdminCourseAccess(session = getStoredSession()) {
  requireSession(session, "Нужен вход администратора.");
  const rows = await request(`/rest/v1/${COURSE_ACCESS_TABLE}?select=${COURSE_ACCESS_ADMIN_FIELDS}&order=created_at.desc`, { session });
  return Array.isArray(rows) ? rows.map(normalizeCourseAccessRow) : [];
}

export async function grantCourseAccess(access, session = getStoredSession()) {
  requireSession(session, "Нужен вход администратора.");
  const body = normalizeCourseAccessForm({ ...access, status: "active" });
  if (!body.profile_id || !body.course_id) throw makeError("Выберите мастера и курс.");
  if (body.access_scope === "step" && !body.step_id) throw makeError("Выберите ступень для доступа.");

  const rows = await request(`/rest/v1/${COURSE_ACCESS_TABLE}`, {
    method: "POST",
    session,
    prefer: "return=representation",
    body
  });
  return rows?.[0] ? normalizeCourseAccessRow(rows[0]) : null;
}

export async function revokeCourseAccess(accessId, session = getStoredSession()) {
  requireSession(session, "Нужен вход администратора.");
  if (!accessId) throw makeError("Missing course access id.");
  const rows = await request(`/rest/v1/${COURSE_ACCESS_TABLE}?id=eq.${encodeURIComponent(accessId)}`, {
    method: "PATCH",
    session,
    prefer: "return=representation",
    body: { status: "revoked", updated_at: new Date().toISOString() }
  });
  return rows?.[0] ? normalizeCourseAccessRow(rows[0]) : null;
}

async function listActiveAccessRows(profileId, session) {
  if (!profileId || !session?.access_token) return [];
  const rows = await request(
    `/rest/v1/${COURSE_ACCESS_TABLE}?profile_id=eq.${encodeURIComponent(profileId)}&status=eq.active&select=${COURSE_ACCESS_FIELDS}&order=created_at.desc`,
    { session }
  );
  return Array.isArray(rows) ? rows.map(normalizeCourseAccessRow) : [];
}

export async function listAvailableCoursesForProfile(profileId, session = getStoredSession()) {
  if (!profileId || !session?.access_token) return [];
  const accessRows = await listActiveAccessRows(profileId, session);
  const index = buildCourseAccessIndex(accessRows);
  const courseIds = [...new Set([...index.fullCourseIds, ...index.stepIdsByCourseId.keys()])];
  const ids = csvIn(courseIds);
  if (!ids) return [];
  const rows = await request(`/rest/v1/${COURSES_TABLE}?id=in.(${ids})&status=eq.published&select=${COURSE_FIELDS}&order=position.asc&order=created_at.asc`, { session });
  return Array.isArray(rows) ? rows.map(normalizeCourseRow) : [];
}

export async function listAvailableCourseSteps(profileId, courseId, session = getStoredSession()) {
  if (!profileId || !courseId || !session?.access_token) return [];
  const accessRows = await listActiveAccessRows(profileId, session);
  const index = buildCourseAccessIndex(accessRows);
  if (index.fullCourseIds.has(text(courseId))) {
    const rows = await request(`/rest/v1/${COURSE_STEPS_TABLE}?course_id=eq.${encodeURIComponent(courseId)}&status=eq.published&select=${COURSE_STEP_FIELDS}&order=position.asc&order=created_at.asc`, { session });
    return Array.isArray(rows) ? rows.map(normalizeCourseStepRow) : [];
  }

  const ids = csvIn([...(index.stepIdsByCourseId.get(text(courseId)) || [])]);
  if (!ids) return [];
  const rows = await request(`/rest/v1/${COURSE_STEPS_TABLE}?course_id=eq.${encodeURIComponent(courseId)}&id=in.(${ids})&status=eq.published&select=${COURSE_STEP_FIELDS}&order=position.asc&order=created_at.asc`, { session });
  return Array.isArray(rows) ? rows.map(normalizeCourseStepRow) : [];
}

export async function listAvailableCourseLessons(profileId, courseId, stepId, session = getStoredSession()) {
  if (!profileId || !courseId || !stepId || !session?.access_token) return [];
  const steps = await listAvailableCourseSteps(profileId, courseId, session);
  if (!steps.some((step) => step.id === text(stepId))) return [];
  const rows = await request(
    `/rest/v1/${COURSE_LESSONS_TABLE}?course_id=eq.${encodeURIComponent(courseId)}&step_id=eq.${encodeURIComponent(stepId)}&status=eq.published&select=${COURSE_LESSON_FIELDS}&order=position.asc&order=created_at.asc`,
    { session }
  );
  return Array.isArray(rows) ? rows.map(normalizeCourseLessonRow) : [];
}
