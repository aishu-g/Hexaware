import { PLFSHouseholdInput } from '@/types/survey';

const STATES_DISTRICTS = [
  { state: 'Maharashtra', districts: ['Mumbai Suburban', 'Pune', 'Nagpur', 'Nashik', 'Thane'] },
  { state: 'Karnataka', districts: ['Bengaluru Urban', 'Mysuru', 'Dharwad', 'Belagavi'] },
  { state: 'Tamil Nadu', districts: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'] },
  { state: 'Delhi', districts: ['New Delhi', 'South Delhi', 'North East Delhi'] },
  { state: 'Uttar Pradesh', districts: ['Lucknow', 'Kanpur Nagar', 'Varanasi', 'Agra'] }
];

const ENUMERATORS = [
  'ENUM_IN_101', 'ENUM_IN_102', 'ENUM_IN_103', 'ENUM_IN_104', 'ENUM_IN_105',
  'ENUM_IN_201', 'ENUM_IN_202', 'ENUM_IN_301', 'ENUM_RISK_99' // ENUM_RISK_99 will generate speed/zero anomalies
];

export function generateSamplePLFSData(count: number = 60): PLFSHouseholdInput[] {
  const households: PLFSHouseholdInput[] = [];

  for (let i = 1; i <= count; i++) {
    const loc = STATES_DISTRICTS[i % STATES_DISTRICTS.length];
    const district = loc.districts[i % loc.districts.length];
    const enumeratorId = ENUMERATORS[i % ENUMERATORS.length];
    const isOutlierEnum = enumeratorId === 'ENUM_RISK_99';

    // Normal or anomalous response time
    const responseTime = isOutlierEnum ? Math.floor(45 + Math.random() * 35) : Math.floor(300 + Math.random() * 900);
    const hhSize = Math.floor(2 + Math.random() * 4); // 2 to 5 members

    const hhId = `HH_${String(i).padStart(4, '0')}`;
    const psuId = `PSU_${loc.state.substring(0, 2).toUpperCase()}_${Math.floor(10 + (i % 5))}`;

    const individuals = [];
    const isChildLaborAnomaly = (i % 12 === 0);
    const isAgeEduAnomaly = (i % 15 === 0);
    const isChildMaritalAnomaly = (i % 18 === 0);
    const isHoursAnomaly = (i % 10 === 0);
    const isEarningsAnomaly = (i % 14 === 0);

    for (let p = 1; p <= hhSize; p++) {
      const personId = `${hhId}_P${p}`;
      let age = Math.floor(5 + Math.random() * 70);
      let sex = Math.random() > 0.48 ? 1 : 2;
      let edu = Math.floor(1 + Math.random() * 9);
      let marital = age < 18 ? 1 : (Math.random() > 0.3 ? 2 : 1);
      let activity = 91; // default student/other
      let earnings = 0;
      let hours = 0;

      if (age >= 18) {
        const randAct = Math.random();
        if (randAct < 0.35) {
          activity = 31; // Regular salaried
          earnings = Math.floor(4000 + Math.random() * 15000);
          hours = Math.floor(35 + Math.random() * 20);
        } else if (randAct < 0.60) {
          activity = 51; // Casual labor
          earnings = Math.floor(1500 + Math.random() * 4500);
          hours = Math.floor(30 + Math.random() * 25);
        } else if (randAct < 0.80) {
          activity = 11; // Self employed
          earnings = Math.floor(3000 + Math.random() * 12000);
          hours = Math.floor(40 + Math.random() * 20);
        } else {
          activity = 81; // Unemployed
          earnings = 0;
          hours = 0;
        }
      }

      // Inject deterministic anomalies based on index flags
      if (p === 1 && isChildLaborAnomaly) {
        age = 12;
        activity = 51; // Casual labor
        earnings = 2000;
        hours = 40;
      }

      if (p === 1 && isAgeEduAnomaly) {
        age = 8;
        edu = 9; // Graduate degree at age 8!
      }

      if (p === 2 && isChildMaritalAnomaly) {
        age = 13;
        marital = 2; // Married at age 13
      }

      if (p === 1 && isHoursAnomaly) {
        hours = 112; // 16 hours/day 7 days a week
      }

      if (p === 1 && isEarningsAnomaly) {
        activity = 51; // Casual labor
        earnings = 85000; // 85k weekly earnings for casual labor
      }

      individuals.push({
        person_id: personId,
        age,
        sex,
        general_education: edu,
        marital_status: marital,
        principal_activity_status: activity,
        subsidiary_activity_status: 0,
        weekly_earnings: earnings,
        hours_worked: hours
      });
    }

    households.push({
      hh_id: hhId,
      state: loc.state,
      district,
      psu_id: psuId,
      sector: i % 2 === 0 ? 'urban' : 'rural',
      hh_size: hhSize,
      religion: i % 5 === 0 ? 'Islam' : 'Hinduism',
      social_group: i % 3 === 0 ? 'OBC' : (i % 4 === 0 ? 'SC' : 'OTH'),
      monthly_expenditure: Math.floor(8000 + Math.random() * 25000),
      land_owned_hectares: i % 2 === 0 ? 0 : parseFloat((Math.random() * 3.5).toFixed(2)),
      enumerator_id: enumeratorId,
      response_time_seconds: responseTime,
      individuals
    });
  }

  return households;
}
