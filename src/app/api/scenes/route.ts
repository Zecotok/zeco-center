import { NextResponse } from 'next/server';
import scenes from '../../sceneConfig.json';

export async function GET() {
  return NextResponse.json(scenes);
}
