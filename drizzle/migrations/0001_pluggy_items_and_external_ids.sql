CREATE TABLE public.pluggy_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id text NOT NULL UNIQUE,
  connector_name text,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pluggy_items TO authenticated;
GRANT ALL ON public.pluggy_items TO service_role;
ALTER TABLE public.pluggy_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pluggy items" ON public.pluggy_items FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.accounts ADD COLUMN external_id text;
ALTER TABLE public.accounts ADD CONSTRAINT accounts_user_external_id_key UNIQUE (user_id, external_id);
ALTER TABLE public.transactions ADD COLUMN external_id text;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_external_id_key UNIQUE (user_id, external_id);