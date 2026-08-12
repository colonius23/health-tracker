import { supabase } from './supabaseClient'

export async function fetchBloodTests() {
  const { data, error } = await supabase.from('blood_tests').select('*').order('test_date', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchActivities(limit = 200) {
  const { data, error } = await supabase.from('activities').select('*').order('activity_date', { ascending: false }).limit(limit)
  if (error) throw error
  return data
}

export async function fetchSleep(limit = 200) {
  const { data, error } = await supabase.from('sleep').select('*').order('sleep_date', { ascending: false }).limit(limit)
  if (error) throw error
  return data
}

export async function fetchBodyMetrics(limit = 400) {
  const { data, error } = await supabase.from('body_metrics').select('*').order('metric_date', { ascending: true }).limit(limit)
  if (error) throw error
  return data
}

export async function fetchVitals(limit = 3000) {
  const { data, error } = await supabase.from('vitals').select('*').order('recorded_date', { ascending: true }).limit(limit)
  if (error) throw error
  return data
}

export async function fetchSettings() {
  const { data, error } = await supabase.from('app_settings').select('*')
  if (error) throw error
  const map = {}
  for (const row of data) map[row.key] = row.value
  return map
}

export async function upsertSetting(key, value) {
  const { data, error } = await supabase.from('app_settings').upsert({ key, value }, { onConflict: 'key' }).select()
  if (error) throw error
  return data
}

export async function insertRows(table, rows) {
  const { data, error } = await supabase.from(table).insert(rows).select()
  if (error) throw error
  return data
}
