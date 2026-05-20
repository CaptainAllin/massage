import { Controller, Post, Body, Headers, BadRequestException, Logger } from '@nestjs/common';
import { Webhook } from 'svix';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UserRole } from '@massage/types';
import { Public } from '../decorators/public.decorator';

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    first_name: string;
    last_name: string;
    image_url: string;
    phone_numbers: Array<{ phone_number: string; id: string }>;
    public_metadata: Record<string, any>;
  };
}

@Controller('webhooks/clerk')
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Post()
  async handleWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Body() rawBody: any,
  ) {
    // Verify webhook signature
    const webhookSecret = this.configService.get('CLERK_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    // Verify the webhook using Svix
    const wh = new Webhook(webhookSecret);
    let evt: ClerkWebhookEvent;

    try {
      evt = wh.verify(JSON.stringify(rawBody), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      this.logger.error('Error verifying webhook:', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    // Handle different event types
    const eventType = evt.type;
    this.logger.log(`Received Clerk webhook: ${eventType}`);

    switch (eventType) {
      case 'user.created':
        await this.handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await this.handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await this.handleUserDeleted(evt.data.id);
        break;
      default:
        this.logger.warn(`Unhandled webhook event type: ${eventType}`);
    }

    return { success: true };
  }

  private async handleUserCreated(data: ClerkWebhookEvent['data']) {
    const primaryEmail = data.email_addresses.find((e) => e.id === data.email_addresses[0]?.id);
    const primaryPhone = data.phone_numbers[0];

    // Determine role from public metadata or default to CLIENT
    const role = (data.public_metadata?.role as UserRole) || UserRole.CLIENT;

    try {
      // Create user in database
      const user = await this.prisma.user.create({
        data: {
          authProviderId: data.id,
          email: primaryEmail?.email_address || '',
          firstName: data.first_name,
          lastName: data.last_name,
          phoneNumber: primaryPhone?.phone_number,
          profileImageUrl: data.image_url,
          role,
        },
      });

      this.logger.log(`User created: ${user.email} with role ${user.role}`);

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: user.id,
          metadata: { source: 'clerk_webhook' },
        },
      });

      return user;
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  private async handleUserUpdated(data: ClerkWebhookEvent['data']) {
    const primaryEmail = data.email_addresses.find((e) => e.id === data.email_addresses[0]?.id);
    const primaryPhone = data.phone_numbers[0];

    try {
      const user = await this.prisma.user.update({
        where: { authProviderId: data.id },
        data: {
          email: primaryEmail?.email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          phoneNumber: primaryPhone?.phone_number,
          profileImageUrl: data.image_url,
          role: (data.public_metadata?.role as UserRole) || UserRole.CLIENT,
        },
      });

      this.logger.log(`User updated: ${user.email}`);

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_UPDATED',
          entityType: 'User',
          entityId: user.id,
          metadata: { source: 'clerk_webhook' },
        },
      });

      return user;
    } catch (error) {
      this.logger.error('Error updating user:', error);
      throw error;
    }
  }

  private async handleUserDeleted(clerkUserId: string) {
    try {
      const user = await this.prisma.user.update({
        where: { authProviderId: clerkUserId },
        data: {
          // Soft delete by marking as inactive or add deletedAt field
          updatedAt: new Date(),
        },
      });

      this.logger.log(`User deleted: ${user.email}`);

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_DELETED',
          entityType: 'User',
          entityId: user.id,
          metadata: { source: 'clerk_webhook' },
        },
      });

      return user;
    } catch (error) {
      this.logger.error('Error deleting user:', error);
      throw error;
    }
  }
}
