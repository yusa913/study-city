export type SlotPositionDb = "A" | "B" | "C" | "D" | "E" | "F";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; created_at: string };
        Insert: { id: string; display_name?: string | null };
        Update: { display_name?: string | null };
      };
      slots: {
        Row: {
          id: string;
          user_id: string;
          position: SlotPositionDb;
          label: string;
          created_at: string;
        };
        Insert: { user_id: string; position: SlotPositionDb; label: string };
        Update: { label?: string };
      };
      study_records: {
        Row: {
          id: string;
          user_id: string;
          slot_id: string;
          minutes: number;
          recorded_on: string;
          common_gain: number;
          dedicated_gain: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          slot_id: string;
          minutes: number;
          recorded_on?: string;
          common_gain?: number;
          dedicated_gain?: number;
        };
        Update: Record<string, never>;
      };
      material_common: {
        Row: { user_id: string; amount: number; updated_at: string };
        Insert: { user_id: string; amount?: number };
        Update: { amount?: number; updated_at?: string };
      };
      material_dedicated: {
        Row: {
          user_id: string;
          slot_position: SlotPositionDb;
          amount: number;
          updated_at: string;
        };
        Insert: { user_id: string; slot_position: SlotPositionDb; amount?: number };
        Update: { amount?: number; updated_at?: string };
      };
      buildings: {
        Row: {
          id: string;
          user_id: string;
          building_index: number;
          stage: number;
          common_invested: number;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          building_index: number;
          stage?: number;
          common_invested?: number;
          completed_at?: string | null;
        };
        Update: {
          stage?: number;
          common_invested?: number;
          completed_at?: string | null;
        };
      };
      building_decorations: {
        Row: { building_id: string; slot_position: SlotPositionDb; amount: number };
        Insert: { building_id: string; slot_position: SlotPositionDb; amount?: number };
        Update: { amount?: number };
      };
      follows: {
        Row: { follower_id: string; followee_id: string; created_at: string };
        Insert: { follower_id: string; followee_id: string };
        Update: Record<string, never>;
      };
    };
  };
}
