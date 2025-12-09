-- Add transaction_date column to transactions table for editable dates
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE;

-- Update existing rows to use created_at date
UPDATE public.transactions SET transaction_date = DATE(created_at) WHERE transaction_date IS NULL;

-- Add UPDATE policy for transactions so users can edit their own transactions
CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);