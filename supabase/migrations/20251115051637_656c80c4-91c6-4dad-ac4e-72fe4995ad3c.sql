-- Create profile for existing user who signed up before the trigger was added
INSERT INTO public.profiles (id)
VALUES ('9afa69c5-e831-4e72-8a72-d72806231f48')
ON CONFLICT (id) DO NOTHING;