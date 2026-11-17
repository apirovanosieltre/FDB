import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const reservations=sqliteTable('reservations',{id:text('id').primaryKey(),firstName:text('first_name').notNull(),lastName:text('last_name').notNull(),guestKey:text('guest_key').unique(),experience:text('experience').notNull(),createdAt:text('created_at').notNull(),requestId:text('request_id').notNull().unique()});

export const adminLoginAttempts=sqliteTable('admin_login_attempts',{id:text('id').primaryKey(),bucket:integer('bucket').notNull(),attempts:integer('attempts').notNull()});
