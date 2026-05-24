import { createClient }
from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl =
  'https://dhnixncqwgzjzoomgltn.supabase.co'

const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobml4bmNxd2d6anpvb21nbHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NDExMzgsImV4cCI6MjA5NDAxNzEzOH0.gWgaN_RqBAOGLNDoic6BHpLQWCaI8YczpapYZ96SZWw'

export const supabase =
  createClient(supabaseUrl, supabaseKey)
