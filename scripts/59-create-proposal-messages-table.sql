-- Create proposal_messages table for proposal communication
CREATE TABLE IF NOT EXISTS public.proposal_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key constraint between proposals and properties if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'proposals_property_id_fkey' 
        AND table_name = 'proposals'
    ) THEN
        ALTER TABLE public.proposals 
        ADD CONSTRAINT proposals_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proposal_messages_proposal_id ON public.proposal_messages(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_messages_sender_id ON public.proposal_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_proposal_messages_created_at ON public.proposal_messages(created_at);

-- Enable RLS
ALTER TABLE public.proposal_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for proposal_messages
CREATE POLICY "Users can view messages for their proposals" ON public.proposal_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.proposals p
            JOIN public.properties prop ON p.property_id = prop.id
            JOIN public.user_profiles up ON prop.agency_id = up.agency_id
            WHERE p.id = proposal_messages.proposal_id
            AND up.user_id = auth.uid()
        )
        OR 
        sender_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.user_id = auth.uid() AND up.user_type = 'admin'
        )
    );

CREATE POLICY "Users can create messages for their proposals" ON public.proposal_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND (
            EXISTS (
                SELECT 1 FROM public.proposals p
                JOIN public.properties prop ON p.property_id = prop.id
                JOIN public.user_profiles up ON prop.agency_id = up.agency_id
                WHERE p.id = proposal_messages.proposal_id
                AND up.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.user_id = auth.uid() AND up.user_type = 'admin'
            )
        )
    );

-- Grant permissions
GRANT ALL ON public.proposal_messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_proposal_messages_updated_at
    BEFORE UPDATE ON public.proposal_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
