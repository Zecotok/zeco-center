import { NextResponse } from 'next/server';
import programs from '../../programsConfig.json';

export async function GET() {
  return NextResponse.json(programs.programs);
}