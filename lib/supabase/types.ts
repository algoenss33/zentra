export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nickname: string
          referral_code: string
          referred_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          nickname: string
          referral_code: string
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nickname?: string
          referral_code?: string
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          reward_amount: number
          status: 'pending' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          reward_amount?: number
          status?: 'pending' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          reward_amount?: number
          status?: 'pending' | 'completed'
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          task_type: string
          task_data: Record<string, any>
          reward_amount: number
          status: 'pending' | 'completed' | 'claimed'
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_type: string
          task_data?: Record<string, any>
          reward_amount?: number
          status?: 'pending' | 'completed' | 'claimed'
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_type?: string
          task_data?: Record<string, any>
          reward_amount?: number
          status?: 'pending' | 'completed' | 'claimed'
          completed_at?: string | null
          created_at?: string
        }
      }
      airdrops: {
        Row: {
          id: string
          user_id: string
          amount: number
          token: string
          status: 'pending' | 'claimed'
          claimed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          token: string
          status?: 'pending' | 'claimed'
          claimed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          token?: string
          status?: 'pending' | 'claimed'
          claimed_at?: string | null
          created_at?: string
        }
      }
      withdrawals: {
        Row: {
          id: string
          user_id: string
          amount: number
          token: string
          wallet_address: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          tx_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          token: string
          wallet_address: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          tx_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          token?: string
          wallet_address?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          tx_hash?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      balances: {
        Row: {
          id: string
          user_id: string
          token: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'send' | 'receive' | 'swap' | 'airdrop' | 'task_reward' | 'referral_reward'
          token: string
          amount: number
          usd_value: number
          to_address: string | null
          from_address: string | null
          tx_hash: string | null
          status: 'pending' | 'confirmed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'send' | 'receive' | 'swap' | 'airdrop' | 'task_reward' | 'referral_reward'
          token: string
          amount: number
          usd_value: number
          to_address?: string | null
          from_address?: string | null
          tx_hash?: string | null
          status?: 'pending' | 'confirmed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'send' | 'receive' | 'swap' | 'airdrop' | 'task_reward' | 'referral_reward'
          token?: string
          amount?: number
          usd_value?: number
          to_address?: string | null
          from_address?: string | null
          tx_hash?: string | null
          status?: 'pending' | 'confirmed' | 'failed'
          created_at?: string
        }
      }
    }
  }
}

