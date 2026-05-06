import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeocodingService {
  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number }> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('Missing GOOGLE_MAPS_API_KEY');
    }
console.log('apiKey', apiKey);
    const trimmed = (address ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('address is required');
    }

    const url = 'https://maps.googleapis.com/maps/api/geocode/json';

    const resp = await axios.get(url, {
      params: { address: trimmed, key: apiKey },
      timeout: 8000,
    });

    const data = resp.data as any;
    console.log('data', data);

    if (!data || data.status !== 'OK' || !Array.isArray(data.results) || !data.results.length) {
      throw new BadRequestException('Could not geocode address');
    }

    const loc = data.results[0]?.geometry?.location;
    const latitude = Number(loc?.lat);
    const longitude = Number(loc?.lng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException('Invalid geocoding response');
    }

    return { latitude, longitude };
  }
}

