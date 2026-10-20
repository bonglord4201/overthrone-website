-- Tag a roll with the signed-in VIP's name, so the lounge can show who rolled it.
ALTER TABLE rolls ADD COLUMN vip_name TEXT;
