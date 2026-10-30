import type { GuestInput, Meta, SampleProfile } from '../schemas';

// Synthetic demo data for mock mode. Not the real engine's dataset.

export const INDUSTRIES = [
  'Manufacturing',
  'Automotive',
  'Electronics',
  'FMCG',
  'Pharmaceuticals',
  'Food & Beverage',
  'Logistics',
  'Energy & Utilities',
  'Chemicals',
  'Textiles',
  'Construction',
  'Aerospace & Defence',
];

export const SENIORITIES = ['Individual Contributor', 'Manager', 'Senior Manager', 'Director', 'C-level / Owner'];
export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
export const REGIONS = ['North India', 'South India', 'East India', 'West India', 'Middle East', 'Europe', 'Southeast Asia'];
export const HALLS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const TAXONOMY = [
  'Industrial Automation',
  'Robotics',
  'PLC & Controls',
  'Motion Control',
  'Machine Vision',
  'CNC Machining',
  'Component Sourcing',
  'Precision Components',
  'Fasteners',
  'Bearings & Transmission',
  'Hydraulics & Pneumatics',
  'Packaging Machinery',
  'Flexible Packaging',
  'Sustainable Packaging',
  'Labelling & Coding',
  'Warehouse Automation',
  'Material Handling',
  'Logistics Software',
  'Cold Chain',
  'IoT Sensors',
  'Industrial IoT',
  'Embedded Systems',
  'PCB & EMS',
  'Wireless Connectivity',
  'Edge Computing',
  'Power Electronics',
  'Test & Measurement',
  'Advanced Materials',
  'Plastics & Polymers',
  'Metals & Alloys',
  'Composites',
  'Additive Manufacturing',
  'Renewable Energy',
  'Energy Storage',
  'Energy Efficiency',
  'Water Treatment',
  'Industrial Safety',
  'Quality Inspection',
  'ERP & MES',
  'Predictive Maintenance',
  'Digital Twin',
  'OT Cybersecurity',
  'AI & Analytics',
  'Contract Manufacturing',
];

export interface TargetBuyer {
  industries: string[];
  seniorities: string[];
  companySizes: string[];
}

export interface MockExhibitor {
  id: string;
  name: string;
  description: string;
  products: string[];
  industries: string[];
  hall: string;
  booth: string;
  tags: string[];
  target: TargetBuyer;
}

const DECIDERS = ['Senior Manager', 'Director', 'C-level / Owner'];
const MANAGERS_UP = ['Manager', 'Senior Manager', 'Director', 'C-level / Owner'];
const ALL_LEVELS = SENIORITIES;
const SME = ['11-50', '51-200'];
const MID = ['51-200', '201-1000'];
const ENT = ['201-1000', '1000+'];
const ALL_SIZES = COMPANY_SIZES;

type Row = [
  name: string,
  tags: string[],
  products: string[],
  industries: string[],
  description: string,
  target: TargetBuyer,
];

const t = (industries: string[], seniorities: string[], companySizes: string[]): TargetBuyer => ({
  industries,
  seniorities,
  companySizes,
});

// Ten exhibitors per hall. Booth numbers are deliberately non-sequential to exercise natural sort.
const BOOTH_NUMBERS = [2, 5, 7, 10, 12, 15, 18, 21, 24, 30];

const HALL_ROWS: Record<string, Row[]> = {
  A: [
    ['Kinetix Automation Pvt Ltd', ['Industrial Automation', 'PLC & Controls', 'Motion Control'], ['PLC controllers', 'Servo drives', 'HMI panels'], ['Manufacturing', 'Automotive'], 'Turnkey line automation for discrete manufacturers. PLCs, servo, HMI - retrofit old lines too!! Service centres in Pune & Chennai.', t(['Manufacturing', 'Automotive', 'FMCG'], DECIDERS, MID)],
    ['RoboWeld Systems', ['Robotics', 'Industrial Automation', 'Quality Inspection'], ['Welding robots', 'Robotic cells', 'Seam tracking'], ['Automotive', 'Manufacturing'], 'robotic welding cells for auto ancillaries, 6-axis arms, seam tracking + offline programming', t(['Automotive', 'Manufacturing'], MANAGERS_UP, ENT)],
    ['Visionary Inspect', ['Machine Vision', 'Quality Inspection', 'AI & Analytics'], ['Vision cameras', 'Defect detection software', 'Barcode readers'], ['Electronics', 'Pharmaceuticals', 'Automotive'], 'AI based visual inspection. Catch surface defects at line speed. Works w/ existing PLCs.', t(['Electronics', 'Pharmaceuticals', 'Automotive', 'FMCG'], MANAGERS_UP, ALL_SIZES)],
    ['CoBot India', ['Robotics', 'Industrial Automation', 'Material Handling'], ['Collaborative robots', 'Grippers', 'Palletizing cells'], ['Manufacturing', 'FMCG', 'Electronics'], 'Cobots that SMEs can deploy in a week. Palletizing, machine tending, screw driving.', t(['Manufacturing', 'FMCG', 'Electronics'], ALL_LEVELS, SME)],
    ['Precisa Motion Tech', ['Motion Control', 'Bearings & Transmission', 'Precision Components'], ['Linear guides', 'Ball screws', 'Stepper motors'], ['Manufacturing', 'Electronics'], 'Linear motion components. Ball screws, guides, actuators. Stock in Bengaluru warehouse.', t(['Manufacturing', 'Electronics', 'Aerospace & Defence'], ALL_LEVELS, ALL_SIZES)],
    ['FluidPower Controls', ['Hydraulics & Pneumatics', 'Industrial Automation', 'Component Sourcing'], ['Pneumatic cylinders', 'Valve manifolds', 'FRL units'], ['Manufacturing', 'Automotive', 'Food & Beverage'], 'Pneumatics for automation OEMs and plant maintenance teams. Fast delivery on standard valves.', t(['Manufacturing', 'Automotive', 'Food & Beverage'], MANAGERS_UP, ALL_SIZES)],
    ['SafeGuard Machinery Safety', ['Industrial Safety', 'PLC & Controls', 'Industrial Automation'], ['Safety light curtains', 'Safety PLCs', 'Machine guarding'], ['Manufacturing', 'Automotive', 'Chemicals'], 'machine safety audits, light curtains, safety relays. ISO 13849 compliance consulting', t(['Manufacturing', 'Automotive', 'Chemicals'], DECIDERS, MID)],
    ['Axion CNC Works', ['CNC Machining', 'Precision Components', 'Contract Manufacturing'], ['CNC turned parts', '5-axis machining', 'Prototyping'], ['Aerospace & Defence', 'Automotive'], 'Precision machined parts to drawing. 5-axis, tight tolerances, AS9100 certified.', t(['Aerospace & Defence', 'Automotive', 'Manufacturing'], MANAGERS_UP, ALL_SIZES)],
    ['DriveLine Gears', ['Bearings & Transmission', 'Component Sourcing', 'Motion Control'], ['Gearboxes', 'Couplings', 'Industrial bearings'], ['Manufacturing', 'Energy & Utilities'], 'Gearboxes & power transmission. Custom ratios. Distributor network across North India.', t(['Manufacturing', 'Energy & Utilities', 'Construction'], ALL_LEVELS, ALL_SIZES)],
    ['Omnitwin Digital', ['Digital Twin', 'Industrial Automation', 'AI & Analytics'], ['Line simulation software', 'Virtual commissioning', 'Throughput analytics'], ['Manufacturing', 'Automotive'], 'Digital twins of production lines - simulate before you buy the robot. Virtual commissioning saves weeks.', t(['Manufacturing', 'Automotive'], DECIDERS, ENT)],
  ],
  B: [
    ['PackRight Machines', ['Packaging Machinery', 'Labelling & Coding', 'Industrial Automation'], ['Form-fill-seal machines', 'Cartoners', 'Case packers'], ['FMCG', 'Food & Beverage', 'Pharmaceuticals'], 'High speed FFS and cartoning lines. Changeover under 10 min. Installed base 400+ in India.', t(['FMCG', 'Food & Beverage', 'Pharmaceuticals'], DECIDERS, MID)],
    ['GreenWrap Packaging', ['Sustainable Packaging', 'Flexible Packaging', 'Plastics & Polymers'], ['Recyclable laminates', 'Compostable pouches', 'Paper-based wraps'], ['FMCG', 'Food & Beverage'], 'mono-material recyclable laminates + compostable pouches. EPR compliance support for brand owners', t(['FMCG', 'Food & Beverage', 'Pharmaceuticals'], MANAGERS_UP, ALL_SIZES)],
    ['FlexiPack Films', ['Flexible Packaging', 'Plastics & Polymers', 'Component Sourcing'], ['BOPP films', 'Printed laminates', 'Stand-up pouches'], ['FMCG', 'Food & Beverage'], 'Flexible packaging converter. Rotogravure printing, 10 colour. MOQ friendly for D2C brands.', t(['FMCG', 'Food & Beverage'], ALL_LEVELS, SME)],
    ['CodeMark Labelling', ['Labelling & Coding', 'Packaging Machinery', 'Quality Inspection'], ['Inkjet coders', 'Label applicators', 'Track & trace'], ['Pharmaceuticals', 'FMCG', 'Food & Beverage'], 'Coding, marking and serialization for pharma track & trace. Integrates with line vision.', t(['Pharmaceuticals', 'FMCG', 'Food & Beverage'], MANAGERS_UP, MID)],
    ['Corrugo Boxes', ['Sustainable Packaging', 'Component Sourcing'], ['Corrugated boxes', 'Die-cut cartons', 'Protective inserts'], ['FMCG', 'Electronics', 'Logistics'], 'Corrugated boxes, die-cut, e-commerce ready. 3 plants. Quick turnaround on custom sizes.', t(['FMCG', 'Electronics', 'Logistics'], ALL_LEVELS, ALL_SIZES)],
    ['ShrinkTech Systems', ['Packaging Machinery', 'Material Handling'], ['Shrink wrappers', 'Stretch wrappers', 'Strapping machines'], ['FMCG', 'Logistics', 'Food & Beverage'], 'End-of-line: shrink, stretch, strapping. Semi-auto to fully automatic.', t(['FMCG', 'Logistics', 'Food & Beverage'], MANAGERS_UP, MID)],
    ['PharmaPack Solutions', ['Packaging Machinery', 'Quality Inspection', 'Labelling & Coding'], ['Blister packing machines', 'Bottle filling lines', 'Leak testers'], ['Pharmaceuticals'], 'GMP compliant blister & bottle lines for pharma. Validation docs included (IQ/OQ/PQ).', t(['Pharmaceuticals'], DECIDERS, MID)],
    ['ColdLink Logistics', ['Cold Chain', 'Logistics Software', 'IoT Sensors'], ['Reefer monitoring', 'Insulated shippers', 'Cold storage'], ['Food & Beverage', 'Pharmaceuticals', 'Logistics'], 'cold chain end-to-end: insulated shippers, reefer IoT tracking, temperature excursions alerts', t(['Food & Beverage', 'Pharmaceuticals', 'Logistics'], MANAGERS_UP, ALL_SIZES)],
    ['BioPoly Materials', ['Sustainable Packaging', 'Plastics & Polymers', 'Advanced Materials'], ['PLA resins', 'Bio-based films', 'Recycled PET'], ['FMCG', 'Chemicals', 'Food & Beverage'], 'Bio-polymers and recycled resins for packaging converters. Food contact certified.', t(['FMCG', 'Chemicals', 'Food & Beverage'], MANAGERS_UP, ALL_SIZES)],
    ['PalletPro Handling', ['Material Handling', 'Warehouse Automation', 'Packaging Machinery'], ['Plastic pallets', 'Pallet inverters', 'Conveyors'], ['Logistics', 'FMCG', 'Manufacturing'], 'Pallets, conveyors, pallet inverters. Rental options for seasonal peaks.', t(['Logistics', 'FMCG', 'Manufacturing'], ALL_LEVELS, ALL_SIZES)],
  ],
  C: [
    ['SensIQ Technologies', ['IoT Sensors', 'Industrial IoT', 'Wireless Connectivity'], ['Vibration sensors', 'Temperature sensors', 'LoRaWAN gateways'], ['Manufacturing', 'Energy & Utilities'], 'Wireless condition-monitoring sensors. LoRaWAN + BLE. Battery life 5 yrs. API first.', t(['Manufacturing', 'Energy & Utilities', 'Electronics'], ALL_LEVELS, ALL_SIZES)],
    ['EdgeNode Systems', ['Edge Computing', 'Industrial IoT', 'Embedded Systems'], ['Industrial edge gateways', 'Rugged PCs', 'Protocol converters'], ['Manufacturing', 'Energy & Utilities', 'Logistics'], 'Edge gateways speaking Modbus, OPC-UA, MQTT. Run your ML model on the shop floor.', t(['Manufacturing', 'Energy & Utilities', 'Logistics'], MANAGERS_UP, ALL_SIZES)],
    ['CircuitCraft EMS', ['PCB & EMS', 'Contract Manufacturing', 'Embedded Systems'], ['PCB assembly', 'Box build', 'Cable harnesses'], ['Electronics', 'Automotive', 'Aerospace & Defence'], 'EMS partner: SMT lines, box build, testing. Low volume high mix welcome. Startups ok.', t(['Electronics', 'Automotive', 'Aerospace & Defence'], ALL_LEVELS, ALL_SIZES)],
    ['ChipBridge Components', ['Component Sourcing', 'Embedded Systems', 'PCB & EMS'], ['Microcontrollers', 'Passive components', 'Sensor ICs'], ['Electronics', 'Automotive'], 'Authorised distributor for MCUs, sensors, passives. Hard-to-find parts & BOM costing.', t(['Electronics', 'Automotive', 'Manufacturing'], ALL_LEVELS, ALL_SIZES)],
    ['WaveLink Wireless', ['Wireless Connectivity', 'IoT Sensors', 'Embedded Systems'], ['NB-IoT modules', 'BLE modules', 'Antennas'], ['Electronics', 'Logistics'], 'Cellular IoT and BLE modules, pre-certified. Design-in support for hardware startups.', t(['Electronics', 'Logistics', 'Energy & Utilities'], ALL_LEVELS, ['1-10', '11-50', '51-200'])],
    ['MeasureMax Instruments', ['Test & Measurement', 'Quality Inspection', 'Power Electronics'], ['Oscilloscopes', 'Power analysers', 'EMC test services'], ['Electronics', 'Automotive', 'Energy & Utilities'], 'T&M instruments and EMC pre-compliance lab. Rent or buy.', t(['Electronics', 'Automotive', 'Energy & Utilities'], ALL_LEVELS, ALL_SIZES)],
    ['PowerCore Electronics', ['Power Electronics', 'Energy Efficiency', 'Component Sourcing'], ['SMPS', 'DC-DC converters', 'EV chargers'], ['Electronics', 'Automotive', 'Energy & Utilities'], 'custom power supplies + EV charger power modules. Made in India, BIS certified', t(['Electronics', 'Automotive', 'Energy & Utilities'], MANAGERS_UP, ALL_SIZES)],
    ['FirmWorks Embedded', ['Embedded Systems', 'Industrial IoT', 'Edge Computing'], ['Firmware development', 'Custom IoT boards', 'OTA platforms'], ['Electronics', 'Manufacturing'], 'Embedded firmware & hardware design services. From PoC to production for IoT products.', t(['Electronics', 'Manufacturing', 'Logistics'], ALL_LEVELS, ['1-10', '11-50', '51-200'])],
    ['TrackSense Asset IoT', ['IoT Sensors', 'Logistics Software', 'Wireless Connectivity'], ['Asset trackers', 'RFID tags', 'Fleet telematics'], ['Logistics', 'Manufacturing'], 'Track pallets, tools, trucks. GPS + RFID + BLE. Dashboard included.', t(['Logistics', 'Manufacturing', 'FMCG'], MANAGERS_UP, ALL_SIZES)],
    ['SecureOT Labs', ['OT Cybersecurity', 'Industrial IoT', 'Edge Computing'], ['OT network monitoring', 'Firewall appliances', 'Security audits'], ['Manufacturing', 'Energy & Utilities', 'Chemicals'], 'Cybersecurity for plants: OT network visibility, IEC 62443 audits, secure remote access.', t(['Manufacturing', 'Energy & Utilities', 'Chemicals'], DECIDERS, ENT)],
  ],
  D: [
    ['Alloyx Metals', ['Metals & Alloys', 'Component Sourcing', 'Advanced Materials'], ['Aluminium extrusions', 'Stainless sheets', 'Titanium bars'], ['Manufacturing', 'Aerospace & Defence', 'Construction'], 'Metals service centre: cut-to-size aluminium, SS, titanium. Mill certs with every lot.', t(['Manufacturing', 'Aerospace & Defence', 'Construction'], ALL_LEVELS, ALL_SIZES)],
    ['FastenAll Industries', ['Fasteners', 'Component Sourcing', 'Precision Components'], ['High-tensile bolts', 'Rivets', 'Custom fasteners'], ['Automotive', 'Construction', 'Manufacturing'], 'Fasteners - standard & special. Auto PPAP level 3. Kanban supply for OEMs.', t(['Automotive', 'Construction', 'Manufacturing'], MANAGERS_UP, ALL_SIZES)],
    ['CompoTech Composites', ['Composites', 'Advanced Materials', 'Contract Manufacturing'], ['Carbon fibre parts', 'GFRP panels', 'Prepregs'], ['Aerospace & Defence', 'Automotive', 'Energy & Utilities'], 'Carbon & glass composites. Lightweighting for EV, drones, wind blades.', t(['Aerospace & Defence', 'Automotive', 'Energy & Utilities'], MANAGERS_UP, ALL_SIZES)],
    ['PolyMould Plastics', ['Plastics & Polymers', 'Contract Manufacturing', 'Component Sourcing'], ['Injection moulded parts', 'Engineering plastics', 'Tooling'], ['Automotive', 'Electronics', 'FMCG'], 'injection moulding 50-650T, in-house tool room. Engineering plastics, PC/ABS, PA66 GF', t(['Automotive', 'Electronics', 'FMCG'], ALL_LEVELS, ALL_SIZES)],
    ['PrintForm Additive', ['Additive Manufacturing', 'Precision Components', 'Advanced Materials'], ['Metal 3D printing', 'SLS nylon parts', 'Rapid prototyping'], ['Aerospace & Defence', 'Automotive', 'Manufacturing'], 'Industrial 3D printing service. Metal DMLS and polymer SLS. Prototypes in 72h.', t(['Aerospace & Defence', 'Automotive', 'Manufacturing'], ALL_LEVELS, ALL_SIZES)],
    ['SealWell Gaskets', ['Component Sourcing', 'Precision Components', 'Plastics & Polymers'], ['O-rings', 'Gaskets', 'Oil seals'], ['Automotive', 'Chemicals', 'Manufacturing'], 'Seals, gaskets, O-rings in NBR, Viton, PTFE. Custom compounds.', t(['Automotive', 'Chemicals', 'Manufacturing'], ALL_LEVELS, ALL_SIZES)],
    ['NanoCoat Surfaces', ['Advanced Materials', 'Industrial Safety', 'Quality Inspection'], ['Anti-corrosion coatings', 'Nano coatings', 'Powder coating'], ['Manufacturing', 'Automotive', 'Construction'], 'Advanced surface coatings - anti-corrosion, anti-microbial, thermal barrier.', t(['Manufacturing', 'Automotive', 'Construction'], MANAGERS_UP, MID)],
    ['CastPro Foundry', ['Metals & Alloys', 'Contract Manufacturing', 'CNC Machining'], ['Investment castings', 'Sand castings', 'Machined castings'], ['Automotive', 'Energy & Utilities', 'Manufacturing'], 'Foundry: investment & sand castings, ferrous and non ferrous, fully machined option.', t(['Automotive', 'Energy & Utilities', 'Manufacturing'], MANAGERS_UP, MID)],
    ['SourceHub Procurement', ['Component Sourcing', 'Contract Manufacturing', 'ERP & MES'], ['Supplier discovery', 'RFQ management', 'Vendor audits'], ['Manufacturing', 'Automotive', 'Electronics'], 'B2B sourcing platform + vendor audits. Find verified suppliers for castings, PCBs, moulding.', t(['Manufacturing', 'Automotive', 'Electronics'], ALL_LEVELS, ALL_SIZES)],
    ['TexFab Technical Textiles', ['Advanced Materials', 'Composites', 'Industrial Safety'], ['Technical fabrics', 'Protective clothing', 'Filter media'], ['Textiles', 'Chemicals', 'Construction'], 'Technical textiles for filtration, PPE and geotextiles.', t(['Textiles', 'Chemicals', 'Construction'], ALL_LEVELS, ALL_SIZES)],
  ],
  E: [
    ['SunGrid Solar', ['Renewable Energy', 'Energy Efficiency', 'Power Electronics'], ['Rooftop solar', 'Solar inverters', 'PPA financing'], ['Energy & Utilities', 'Manufacturing'], 'Rooftop & ground-mount solar for factories. Zero capex PPA model. 300MW installed.', t(['Manufacturing', 'FMCG', 'Textiles', 'Food & Beverage'], DECIDERS, ALL_SIZES)],
    ['VoltStore Batteries', ['Energy Storage', 'Renewable Energy', 'Power Electronics'], ['Li-ion battery packs', 'BESS containers', 'BMS'], ['Energy & Utilities', 'Automotive'], 'Battery energy storage systems for C&I and EV packs. In-house BMS.', t(['Energy & Utilities', 'Automotive', 'Manufacturing'], DECIDERS, ALL_SIZES)],
    ['EnerSave Audits', ['Energy Efficiency', 'Industrial IoT', 'AI & Analytics'], ['Energy audits', 'Smart meters', 'Compressed air audits'], ['Manufacturing', 'Chemicals', 'Textiles'], 'Cut factory energy bills 10-25%. Audits, sub-metering, compressed air leak detection.', t(['Manufacturing', 'Chemicals', 'Textiles', 'Food & Beverage'], MANAGERS_UP, ALL_SIZES)],
    ['AquaPure Water Systems', ['Water Treatment', 'Energy Efficiency'], ['ETP/STP plants', 'Zero liquid discharge', 'RO systems'], ['Chemicals', 'Textiles', 'Pharmaceuticals', 'Food & Beverage'], 'Effluent treatment + ZLD for textile, pharma and chemical plants. O&M contracts.', t(['Chemicals', 'Textiles', 'Pharmaceuticals', 'Food & Beverage'], DECIDERS, MID)],
    ['WindTurbo Components', ['Renewable Energy', 'Composites', 'Bearings & Transmission'], ['Wind turbine gearboxes', 'Blade repair', 'Slewing bearings'], ['Energy & Utilities'], 'Components and services for wind farms - gearboxes, bearings, blade repair.', t(['Energy & Utilities'], MANAGERS_UP, ENT)],
    ['HeatRecover Systems', ['Energy Efficiency', 'Industrial Automation'], ['Waste heat recovery', 'Heat pumps', 'Industrial boilers'], ['Chemicals', 'Food & Beverage', 'Textiles'], 'Waste heat recovery and industrial heat pumps. Payback < 3 yrs typical.', t(['Chemicals', 'Food & Beverage', 'Textiles', 'Manufacturing'], DECIDERS, MID)],
    ['GreenH2 Ventures', ['Renewable Energy', 'Energy Storage', 'Advanced Materials'], ['Electrolysers', 'Hydrogen storage', 'Fuel cells'], ['Energy & Utilities', 'Chemicals'], 'Green hydrogen electrolysers and fuel cell systems for industrial decarbonisation pilots.', t(['Energy & Utilities', 'Chemicals', 'Manufacturing'], DECIDERS, ENT)],
    ['SafeSite PPE', ['Industrial Safety', 'Component Sourcing'], ['Safety helmets', 'Gas detectors', 'Fall protection'], ['Construction', 'Chemicals', 'Manufacturing'], 'PPE and gas detection for plants and construction sites. Bulk supply & training.', t(['Construction', 'Chemicals', 'Manufacturing'], ALL_LEVELS, ALL_SIZES)],
    ['SmartGrid Meters', ['Energy Efficiency', 'IoT Sensors', 'Industrial IoT'], ['Smart energy meters', 'Power quality analysers', 'Load monitoring'], ['Energy & Utilities', 'Manufacturing'], 'IoT energy meters with cloud dashboard. Power quality, harmonics, demand alerts.', t(['Energy & Utilities', 'Manufacturing', 'Construction'], ALL_LEVELS, ALL_SIZES)],
    ['EcoCycle Recycling', ['Sustainable Packaging', 'Plastics & Polymers', 'Water Treatment'], ['Plastic waste recycling', 'EPR credits', 'Scrap management'], ['FMCG', 'Manufacturing', 'Chemicals'], 'EPR compliance & plastic waste recycling. Certificates for brand owners.', t(['FMCG', 'Manufacturing', 'Chemicals'], MANAGERS_UP, ALL_SIZES)],
  ],
  F: [
    ['FactoryOS MES', ['ERP & MES', 'Industrial IoT', 'AI & Analytics'], ['MES software', 'OEE dashboards', 'Shop-floor tablets'], ['Manufacturing', 'Automotive', 'Pharmaceuticals'], 'Cloud MES for mid-size plants. OEE, downtime, traceability. Go live in 6 weeks.', t(['Manufacturing', 'Automotive', 'Pharmaceuticals'], DECIDERS, MID)],
    ['PredictaMaint AI', ['Predictive Maintenance', 'AI & Analytics', 'IoT Sensors'], ['Predictive maintenance platform', 'Vibration analytics', 'Failure prediction'], ['Manufacturing', 'Energy & Utilities', 'Chemicals'], 'predict motor / pump failures 2-4 weeks early. Bring your sensors or use ours.', t(['Manufacturing', 'Energy & Utilities', 'Chemicals'], MANAGERS_UP, ALL_SIZES)],
    ['LogiRoute Software', ['Logistics Software', 'Warehouse Automation', 'AI & Analytics'], ['WMS', 'Route optimisation', 'Yard management'], ['Logistics', 'FMCG', 'Manufacturing'], 'WMS + transport route optimisation. Integrates with SAP, Tally, Oracle.', t(['Logistics', 'FMCG', 'Manufacturing'], MANAGERS_UP, ALL_SIZES)],
    ['ERPNova Solutions', ['ERP & MES', 'AI & Analytics'], ['ERP for SMEs', 'Inventory management', 'GST invoicing'], ['Manufacturing', 'Textiles', 'FMCG'], 'ERP built for Indian SME manufacturers. GST ready, multi-plant, mobile app.', t(['Manufacturing', 'Textiles', 'FMCG'], DECIDERS, ['1-10', '11-50', '51-200'])],
    ['AutoStore Robotics', ['Warehouse Automation', 'Robotics', 'Material Handling'], ['AMRs', 'Shuttle systems', 'Pick-to-light'], ['Logistics', 'FMCG', 'Electronics'], 'Warehouse robotics: autonomous mobile robots, goods-to-person, pick to light.', t(['Logistics', 'FMCG', 'Electronics'], DECIDERS, ENT)],
    ['QualiTrack QMS', ['Quality Inspection', 'ERP & MES', 'AI & Analytics'], ['QMS software', 'SPC analytics', 'Audit management'], ['Pharmaceuticals', 'Automotive', 'Manufacturing'], 'Quality management software: CAPA, SPC, supplier quality, audit trails (21 CFR Part 11).', t(['Pharmaceuticals', 'Automotive', 'Manufacturing'], MANAGERS_UP, ALL_SIZES)],
    ['TwinSight Analytics', ['Digital Twin', 'AI & Analytics', 'Predictive Maintenance'], ['Asset digital twins', '3D plant models', 'What-if simulation'], ['Energy & Utilities', 'Chemicals', 'Manufacturing'], 'Plant-wide digital twin, 3D + live data. Simulate maintenance and capacity scenarios.', t(['Energy & Utilities', 'Chemicals', 'Manufacturing'], DECIDERS, ENT)],
    ['IndustriLearn', ['Industrial Automation', 'Industrial Safety', 'PLC & Controls'], ['PLC training', 'Safety training', 'VR simulators'], ['Manufacturing', 'Automotive', 'Construction'], 'Skilling for shop-floor teams: PLC, robotics, safety. VR simulators, NSDC aligned.', t(['Manufacturing', 'Automotive', 'Construction'], ALL_LEVELS, ALL_SIZES)],
    ['CloudSCADA', ['Industrial IoT', 'PLC & Controls', 'OT Cybersecurity'], ['Cloud SCADA', 'Remote monitoring', 'Alarm management'], ['Energy & Utilities', 'Manufacturing', 'Food & Beverage'], 'SCADA in the cloud. Connect PLCs securely, remote alarms on your phone.', t(['Energy & Utilities', 'Manufacturing', 'Food & Beverage'], MANAGERS_UP, ALL_SIZES)],
    ['SupplyGraph AI', ['AI & Analytics', 'Component Sourcing', 'Logistics Software'], ['Supplier risk scoring', 'Demand forecasting', 'Spend analytics'], ['Manufacturing', 'Automotive', 'Electronics'], 'AI for procurement teams: spend analytics, supplier risk, demand forecasts.', t(['Manufacturing', 'Automotive', 'Electronics', 'FMCG'], DECIDERS, ENT)],
  ],
};

export const EXHIBITORS: MockExhibitor[] = HALLS.flatMap((hall) =>
  HALL_ROWS[hall].map(([name, tags, products, industries, description, target], i) => ({
    id: `ex-${hall.toLowerCase()}${String(i + 1).padStart(2, '0')}`,
    name,
    description,
    products,
    industries,
    hall,
    booth: `${hall}-${BOOTH_NUMBERS[i]}`,
    tags,
    target,
  })),
);

export const SAMPLE_PROFILES: SampleProfile[] = [
  {
    id: 'sample-factory-owner',
    label: 'Factory owner, automation buyer',
    profile: {
      name: 'Rajesh Kumar',
      industry: 'Manufacturing',
      jobRole: 'Owner & Managing Director',
      seniority: 'C-level / Owner',
      companySize: '51-200',
      region: 'West India',
      interests: ['Industrial Automation', 'Robotics', 'PLC & Controls', 'Predictive Maintenance'],
      freeText:
        'Looking to automate our machining and assembly lines. Interested in cobots, PLC upgrades and anything that cuts downtime.',
    },
  },
  {
    id: 'sample-procurement-packaging',
    label: 'Procurement head, packaging',
    profile: {
      name: 'Priya Nair',
      industry: 'FMCG',
      jobRole: 'Head of Procurement',
      seniority: 'Director',
      companySize: '201-1000',
      region: 'South India',
      interests: ['Sustainable Packaging', 'Flexible Packaging', 'Packaging Machinery', 'Labelling & Coding'],
      freeText:
        'Need recyclable laminates to meet EPR targets, plus a faster form-fill-seal line for our snacks range.',
    },
  },
  {
    id: 'sample-startup-cto',
    label: 'Startup CTO, IoT sensors',
    profile: {
      name: 'Arjun Mehta',
      industry: 'Electronics',
      jobRole: 'Co-founder & CTO',
      seniority: 'C-level / Owner',
      companySize: '11-50',
      region: 'South India',
      interests: ['IoT Sensors', 'Wireless Connectivity', 'PCB & EMS', 'Embedded Systems'],
      freeText:
        'Building a vibration sensor for predictive maintenance. Need BLE/LoRa modules, a low-volume EMS partner and sensor ICs.',
    },
  },
];

export const META: Meta = {
  industries: INDUSTRIES,
  seniorities: SENIORITIES,
  companySizes: COMPANY_SIZES,
  regions: REGIONS,
  halls: HALLS,
  taxonomy: TAXONOMY,
  sampleProfiles: SAMPLE_PROFILES,
};

export const EMPTY_GUEST_INPUT: GuestInput = {
  name: '',
  industry: '',
  jobRole: '',
  seniority: '',
  companySize: '',
  region: '',
  interests: [],
  freeText: '',
};
