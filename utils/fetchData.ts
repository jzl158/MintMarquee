import type { FieldSet } from 'airtable';

export async function fetchData(id: string): Promise<FieldSet>;
export async function fetchData(): Promise<FieldSet[]>;

export async function fetchData(id?: string): Promise<FieldSet | FieldSet[]> {
  let results: FieldSet[];

  // Only initialize Airtable if API key is configured
  if (process.env.AIRTABLE_API_KEY &&
      process.env.AIRTABLE_BASE_NAME &&
      process.env.AIRTABLE_TABLE_NAME) {
    try {
      // Dynamic import of Airtable only when needed
      const Airtable = require('airtable');
      const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_NAME);

      results = [...await base(process.env.AIRTABLE_TABLE_NAME)
        .select({ view: process.env.AIRTABLE_VIEW_NAME })
        .all()]
        .map(({ fields }) => fields);
    } catch (error) {
      console.warn('Airtable connection failed, using mock data');
      results = require('../mockdata').default;
    }
  } else {
    // Use mock data if Airtable has not been configured
    results = require('../mockdata').default;
  }

  if (id) {
    return results.find(result =>
      result.id === id
    );
  }

  return results;
}
