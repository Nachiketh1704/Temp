import { UserLocation } from "../../models/userLocation";
import { HttpException } from "../../utils/httpException";

export class UserLiveLocationService {
  async upsert(userId: number, payload: { lat: number; lng: number; accuracy?: number; heading?: number; speed?: number; provider?: string; battery?: number }) {
    if (typeof payload.lat !== "number" || typeof payload.lng !== "number") {
      throw new HttpException("lat and lng are required", 400);
    }
    const now = new Date().toISOString();
    
    // Use transaction for atomic upsert operation
    return await UserLocation.transaction(async (trx) => {
      // Delete existing location for this user
      await UserLocation.query(trx).where({ userId }).delete();
      
      // Insert new location
      return await UserLocation.query(trx).insertAndFetch({
        userId,
        lat: payload.lat,
        lng: payload.lng,
        accuracy: payload.accuracy,
        heading: payload.heading,
        speed: payload.speed,
        provider: payload.provider,
        createdAt: now,
        battery: payload.battery,
      });
    });
  }

  async getRecent(userId: number, limit = 50) {
    return await UserLocation.query().where({ userId }).orderBy("createdAt", "desc").limit(limit);
  }

  async getCurrentLocation(userId: number) {
    return await UserLocation.query().where({ userId }).first();
  }
}

// @ts-ignore: No type definitions for 'country-state-city'
import { Country, State, City } from 'country-state-city';

export interface LocationData {
  countries: CountryData[];
  states: StateData[];
  cities: CityData[];
}

export interface CountryData {
  id: number;
  name: string;
  isoCode: string;
  phoneCode: string;
  flag: string;
  currency: string;
  latitude: string;
  longitude: string;
}

export interface StateData {
  id: number;
  name: string;
  stateCode: string;
  countryId: number;
  latitude: string;
  longitude: string;
}

export interface CityData {
  id: number;
  name: string;
  stateId: number;
  latitude: string;
  longitude: string;
}

export class LocationService {
  /**
   * Get all countries
   */
  async getAllCountries(): Promise<any[]> {
    try {
      const countries = Country.getAllCountries();
      return countries.map(country => ({
        name: country.name,
        isoCode: country.isoCode,
        flag: country.flag,
        currency: country.currency,
        latitude: country.latitude,
        longitude: country.longitude
      }));
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw new Error('Failed to fetch countries');
    }
  }

  /**
   * Get states by country code
   */
  async getStatesByCountry(countryCode: string): Promise<any[]> {
    try {
      const states = State.getStatesOfCountry(countryCode);
      return states;
    } catch (error) {
      console.error('Error fetching states:', error);
      throw new Error('Failed to fetch states');
    }
  }

  /**
   * Get cities by state code and country code
   */
  async getCitiesByState(countryCode: string, stateCode: string): Promise<any[]> {
    try {
      const cities = City.getCitiesOfState(countryCode, stateCode);
      return cities
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw new Error('Failed to fetch cities');
    }
  }

  /**
   * Search countries by name
   */
  async searchCountries(query: string): Promise<CountryData[]> {
    try {
      const countries = Country.getAllCountries();
      const filtered :any= countries.filter(country => 
        country.name.toLowerCase().includes(query.toLowerCase()) ||
        country.isoCode.toLowerCase().includes(query.toLowerCase())
      );
      
      return filtered;
    } catch (error) {
      console.error('Error searching countries:', error);
      throw new Error('Failed to search countries');
    }
  }

  /**
   * Search states by name within a country
   */
  async searchStates(countryCode: string, query: string): Promise<StateData[]> {
    try {
      const states = State.getStatesOfCountry(countryCode);
      const filtered :any= states.filter(state => 
        state.name.toLowerCase().includes(query.toLowerCase()) ||
        state.isoCode.toLowerCase().includes(query.toLowerCase())
      );
      
      return filtered;
    } catch (error) {
      console.error('Error searching states:', error);
      throw new Error('Failed to search states');
    }
  }

  /**
   * Search cities by name within a state
   */
  async searchCities(countryCode: string, stateCode: string, query: string): Promise<CityData[]> {
    try {
      const cities = City.getCitiesOfState(countryCode, stateCode);
      const filtered : any= cities.filter(city => 
        city.name.toLowerCase().includes(query.toLowerCase())
      );
      
      return filtered;
    } catch (error) {
      console.error('Error searching cities:', error);
      throw new Error('Failed to search cities');
    }
  }

  /**
   * Get country by ISO code
   */
  async getCountryByCode(countryCode: string): Promise<any | null> {
    try {
      const country = Country.getCountryByCode(countryCode);
      if (!country) return null;
      
      return country;
    } catch (error) {
      console.error('Error fetching country:', error);
      throw new Error('Failed to fetch country');
    }
  }

  /**
   * Get state by code within a country
   */
  async getStateByCode(countryCode: string, stateCode: string): Promise<any | null> {
    try {
      const state = State.getStateByCode(stateCode);
      if (!state) return null;
      
      return state
    } catch (error) {
      console.error('Error fetching state:', error);
      throw new Error('Failed to fetch state');
    }
  }
}
