#!/usr/bin/env node
import { db } from './drizzle';
import { users, teams, teamMembers } from './schema';
import { eq } from 'drizzle-orm';

async function seedDevelopmentData() {
  try {
    console.log('Seeding development data...');

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, 1))
      .limit(1);

    if (existingUser.length === 0) {
      console.log('Creating seed user...');
      await db.insert(users).values({
        id: 1,
        name: 'John Developer',
        email: 'john@example.com',
        passwordHash: '$2a$10$dummy',
        role: 'admin',
      });
      console.log('✓ User created');
    } else {
      console.log('✓ User already exists');
    }

    // Check if team already exists
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.id, 1))
      .limit(1);

    if (existingTeam.length === 0) {
      console.log('Creating seed team...');
      await db.insert(teams).values({
        id: 1,
        name: 'Acme Real Estate',
      });
      console.log('✓ Team created');
    } else {
      console.log('✓ Team already exists');
    }

    // Check if team membership exists
    const existingMembership = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, 1))
      .limit(1);

    if (existingMembership.length === 0) {
      console.log('Adding user to team...');
      await db.insert(teamMembers).values({
        userId: 1,
        teamId: 1,
        role: 'admin',
      });
      console.log('✓ User added to team');
    } else {
      console.log('✓ User already in team');
    }

    console.log('\n✓ Development data seeded successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDevelopmentData();
