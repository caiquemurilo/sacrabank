CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  institution text NOT NULL,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own accounts" ON public.accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  occurred_on date NOT NULL,
  description text NOT NULL,
  merchant text,
  category text NOT NULL,
  amount numeric(14,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.transactions (user_id, occurred_on DESC);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cc uuid; sv uuid; cr uuid;
  m0 date := date_trunc('month', current_date)::date;
  m1 date := (date_trunc('month', current_date) - interval '1 month')::date;
  r record;
BEGIN
  INSERT INTO accounts(user_id,name,type,institution,balance) VALUES (NEW.id,'Conta Corrente','corrente','Banco Sacra',8742.35) RETURNING id INTO cc;
  INSERT INTO accounts(user_id,name,type,institution,balance) VALUES (NEW.id,'Poupança','poupanca','Banco Sacra',15320.00) RETURNING id INTO sv;
  INSERT INTO accounts(user_id,name,type,institution,balance) VALUES (NEW.id,'Cartão Platinum','cartao','Sacra Card',-2184.90) RETURNING id INTO cr;

  FOR r IN SELECT * FROM (VALUES
    (0,1,'Salário','Empresa XPTO','Salário',7800.00,'cc'),
    (0,2,'Aluguel','Imobiliária Lar','Moradia',-2400.00,'cc'),
    (0,3,'Pedido iFood','iFood','Alimentação',-62.90,'cr'),
    (0,4,'Supermercado','Pão de Açúcar','Mercado',-412.37,'cr'),
    (0,5,'Corrida Uber','Uber','Transporte',-28.40,'cr'),
    (0,6,'Netflix','Netflix','Assinaturas',-55.90,'cr'),
    (0,7,'Pedido iFood','iFood','Alimentação',-48.50,'cr'),
    (0,8,'Conta de luz','Enel','Contas',-218.64,'cc'),
    (0,9,'Farmácia','Drogasil','Saúde',-87.30,'cr'),
    (0,10,'Corrida Uber','Uber','Transporte',-35.10,'cr'),
    (0,11,'Freelance','Cliente Alfa','Renda extra',1200.00,'cc'),
    (0,12,'Spotify','Spotify','Assinaturas',-21.90,'cr'),
    (0,13,'Pedido iFood','iFood','Alimentação',-74.20,'cr'),
    (0,14,'Academia','Smart Fit','Saúde',-119.90,'cc'),
    (0,15,'Restaurante','Outback','Alimentação',-186.00,'cr'),
    (0,16,'Combustível','Shell','Transporte',-250.00,'cr'),
    (0,17,'Internet','Vivo Fibra','Contas',-129.99,'cc'),
    (0,18,'Amazon','Amazon','Compras',-239.80,'cr'),
    (0,19,'Pedido iFood','iFood','Alimentação',-39.90,'cr'),
    (0,20,'Rendimento poupança','Banco Sacra','Rendimentos',82.15,'sv'),
    (1,1,'Salário','Empresa XPTO','Salário',7800.00,'cc'),
    (1,2,'Aluguel','Imobiliária Lar','Moradia',-2400.00,'cc'),
    (1,3,'Supermercado','Carrefour','Mercado',-538.12,'cr'),
    (1,4,'Pedido iFood','iFood','Alimentação',-57.80,'cr'),
    (1,6,'Netflix','Netflix','Assinaturas',-55.90,'cr'),
    (1,7,'Corrida Uber','Uber','Transporte',-42.60,'cr'),
    (1,8,'Conta de luz','Enel','Contas',-196.22,'cc'),
    (1,10,'Pedido iFood','iFood','Alimentação',-68.40,'cr'),
    (1,11,'Cinema','Cinemark','Lazer',-96.00,'cr'),
    (1,12,'Spotify','Spotify','Assinaturas',-21.90,'cr'),
    (1,13,'Academia','Smart Fit','Saúde',-119.90,'cc'),
    (1,14,'Combustível','Ipiranga','Transporte',-230.00,'cr'),
    (1,16,'Internet','Vivo Fibra','Contas',-129.99,'cc'),
    (1,17,'Pedido iFood','iFood','Alimentação',-82.30,'cr'),
    (1,18,'Mercado Livre','Mercado Livre','Compras',-159.90,'cr'),
    (1,20,'Restaurante','Coco Bambu','Alimentação',-214.50,'cr'),
    (1,22,'Farmácia','Drogasil','Saúde',-45.60,'cr'),
    (1,24,'Supermercado','Pão de Açúcar','Mercado',-301.45,'cr'),
    (1,26,'Pedido iFood','iFood','Alimentação',-53.70,'cr'),
    (1,28,'Rendimento poupança','Banco Sacra','Rendimentos',79.80,'sv')
  ) AS t(mo,dy,descr,merch,cat,amt,acc)
  LOOP
    INSERT INTO transactions(user_id,account_id,occurred_on,description,merchant,category,amount)
    VALUES (NEW.id,
      CASE r.acc WHEN 'cc' THEN cc WHEN 'sv' THEN sv ELSE cr END,
      LEAST((CASE r.mo WHEN 0 THEN m0 ELSE m1 END) + (r.dy - 1), current_date),
      r.descr, r.merch, r.cat, r.amt);
  END LOOP;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.seed_demo_data() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created_seed
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.seed_demo_data();