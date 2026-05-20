import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Service Role Key must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Verify JWT token from client
   */
  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new Error('Invalid token');
    }

    return data.user;
  }

  /**
   * Admin: Create user
   */
  async createUser(email: string, password: string, metadata?: any) {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error) throw error;
    return data.user;
  }

  /**
   * Admin: Update user
   */
  async updateUser(userId: string, updates: any) {
    const { data, error } = await this.supabase.auth.admin.updateUserById(
      userId,
      updates
    );

    if (error) throw error;
    return data.user;
  }

  /**
   * Admin: Delete user
   */
  async deleteUser(userId: string) {
    const { error } = await this.supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const { data, error } = await this.supabase.auth.admin.getUserById(userId);
    if (error) throw error;
    return data.user;
  }
}
