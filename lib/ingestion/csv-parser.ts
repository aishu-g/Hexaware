import Papa from 'papaparse';
import { PLFSHouseholdInput, PLFSIndividualInput } from '@/types/survey';

export interface CSVRow {
  hh_id: string;
  state: string;
  district: string;
  psu_id: string;
  sector?: string;
  hh_size?: string;
  religion?: string;
  social_group?: string;
  monthly_expenditure?: string;
  land_owned_hectares?: string;
  enumerator_id: string;
  response_time_seconds?: string;
  person_id: string;
  age: string;
  sex: string;
  general_education: string;
  marital_status: string;
  principal_activity_status: string;
  subsidiary_activity_status?: string;
  weekly_earnings?: string;
  hours_worked?: string;
}

export function parsePLFSCSV(csvContent: string): PLFSHouseholdInput[] {
  const result = Papa.parse<CSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  if (result.errors && result.errors.length > 0) {
    console.warn('CSV parsing warning:', result.errors[0].message);
  }

  const householdMap = new Map<string, PLFSHouseholdInput>();

  for (const row of result.data) {
    if (!row.hh_id || !row.person_id) continue;

    const hhKey = `${row.state}_${row.district}_${row.hh_id}`;

    if (!householdMap.has(hhKey)) {
      householdMap.set(hhKey, {
        hh_id: String(row.hh_id).trim(),
        state: String(row.state || 'Maharashtra').trim(),
        district: String(row.district || 'Mumbai Suburbs').trim(),
        psu_id: String(row.psu_id || 'PSU_101').trim(),
        sector: (row.sector?.toLowerCase() === 'urban' ? 'urban' : 'rural'),
        hh_size: parseInt(row.hh_size || '1', 10),
        religion: row.religion || 'Hinduism',
        social_group: row.social_group || 'OTH',
        monthly_expenditure: parseFloat(row.monthly_expenditure || '0'),
        land_owned_hectares: parseFloat(row.land_owned_hectares || '0'),
        enumerator_id: String(row.enumerator_id || 'ENUM_001').trim(),
        response_time_seconds: parseFloat(row.response_time_seconds || '300'),
        individuals: []
      });
    }

    const hh = householdMap.get(hhKey)!;

    const ind: PLFSIndividualInput = {
      person_id: String(row.person_id).trim(),
      age: parseInt(row.age || '0', 10),
      sex: parseInt(row.sex || '1', 10),
      general_education: parseInt(row.general_education || '1', 10),
      marital_status: parseInt(row.marital_status || '1', 10),
      principal_activity_status: parseInt(row.principal_activity_status || '91', 10),
      subsidiary_activity_status: parseInt(row.subsidiary_activity_status || '0', 10),
      weekly_earnings: parseFloat(row.weekly_earnings || '0'),
      hours_worked: parseFloat(row.hours_worked || '0')
    };

    hh.individuals.push(ind);
  }

  return Array.from(householdMap.values());
}
