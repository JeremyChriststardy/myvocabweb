-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_analysis_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  input_type text NOT NULL,
  raw_input text,
  detected_word text,
  detected_context text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_analysis_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.community_dictionary (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  word text NOT NULL,
  definition text NOT NULL,
  domain text,
  example text,
  generated_by text DEFAULT 'gemini'::text,
  created_at timestamp with time zone DEFAULT now(),
  embedding USER-DEFINED,
  part_of_speech USER-DEFINED,
  CONSTRAINT community_dictionary_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dictionary_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  word text NOT NULL,
  definition text NOT NULL,
  domain text NOT NULL,
  example text,
  embedding USER-DEFINED,
  source text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  part_of_speech USER-DEFINED,
  CONSTRAINT dictionary_entries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.folder_words (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  folder_id uuid,
  word_id uuid,
  added_at timestamp without time zone DEFAULT now(),
  CONSTRAINT folder_words_pkey PRIMARY KEY (id),
  CONSTRAINT folder_words_word_id_fkey FOREIGN KEY (word_id) REFERENCES public.user_vocabs(id),
  CONSTRAINT folder_words_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.user_folders(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  avatar_url text,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  total_words_saved integer DEFAULT 0 CHECK (total_words_saved >= 0),
  streak_days integer DEFAULT 0 CHECK (streak_days >= 0),
  last_active_date date,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  is_deletable boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_folders_pkey PRIMARY KEY (id),
  CONSTRAINT user_folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_vocabs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  dictionary_entry_id uuid,
  status USER-DEFINED DEFAULT 'New'::word_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  phonetic text,
  image_path text,
  CONSTRAINT user_vocabs_pkey PRIMARY KEY (id),
  CONSTRAINT user_vocabs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_vocabs_dictionary_entry_id_fkey FOREIGN KEY (dictionary_entry_id) REFERENCES public.dictionary_entries(id)
);