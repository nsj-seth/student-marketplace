export const DEMO_DOMAIN = "demo.studentmarket.local";
export const DEMO_PASSWORD = "DemoPass!2026";

export const firstNames = [
  "Kwame","Ama","Kofi","Akosua","Yaw","Abena","Kojo","Adwoa","Nana","Efua",
  "Daniel","Priscilla","Michael","Esi","Emmanuel","Mabel","Kelvin","Selina","Joel","Naana",
  "Richmond","Gifty","Samuel","Belinda","Joseph","Anita","Francis","Eunice","Bernard","Janet",
  "Elvis","Sandra","Dennis","Ruth","Isaac","Patricia","David","Grace","Felix","Angela",
  "Nathan","Esther","Joshua","Linda","Bright","Pearl","Eric","Maame"
];

export const lastNames = [
  "Mensah","Owusu","Asante","Boateng","Osei","Agyeman","Appiah","Darko","Frimpong","Antwi",
  "Addo","Acheampong","Adjei","Boadu","Opoku","Amponsah","Amoah","Sarpong","Kwarteng","Nyarko",
  "Tetteh","Nartey","Quaye","Arthur","Essien","Baah","Gyasi","Poku","Aidoo","Danquah"
];

export type DemoBusinessTemplate = {
  name: string;
  type: "STUDENT_BUSINESS" | "OTHER_BUSINESS";
  university?: "KNUST" | "UG" | "UCC" | "UPSA";
  location: string;
  categories: string[];
  description: string;
  pickup: boolean;
  delivery: boolean;
};

export const businessTemplates: DemoBusinessTemplate[] = [
  { name:"Campus Bites", type:"STUDENT_BUSINESS", university:"KNUST", location:"Ayeduase, Kumasi", categories:["Food"], description:"Fast, filling campus meals with rice dishes, grilled chicken, noodles and fresh drinks for students around KNUST.", pickup:true, delivery:true },
  { name:"TechPoint KNUST", type:"STUDENT_BUSINESS", university:"KNUST", location:"Kotei, Kumasi", categories:["Electronics","Accessories"], description:"Affordable phone and laptop accessories, charging gear, cables and everyday tech essentials for campus life.", pickup:true, delivery:true },
  { name:"Ama's Closet", type:"STUDENT_BUSINESS", university:"UG", location:"Legon, Accra", categories:["Fashion","Accessories"], description:"Trendy student fashion, casual wear and accessories curated for affordable everyday campus style.", pickup:true, delivery:true },
  { name:"PrintHub", type:"STUDENT_BUSINESS", university:"KNUST", location:"Commercial Area, KNUST", categories:["Services","Books"], description:"Reliable printing, binding, document finishing and academic material services with quick campus turnaround.", pickup:true, delivery:false },
  { name:"Glow Beauty GH", type:"OTHER_BUSINESS", location:"Adum, Kumasi", categories:["Beauty"], description:"Beauty and personal-care essentials including skincare, hair care and grooming products selected for daily routines.", pickup:true, delivery:true },
  { name:"Hostel Essentials", type:"STUDENT_BUSINESS", university:"UCC", location:"Amamoma, Cape Coast", categories:["Other","Accessories"], description:"Useful hostel and room essentials for students, from storage items to compact everyday household accessories.", pickup:true, delivery:true },
  { name:"Nana's Sneakers", type:"OTHER_BUSINESS", location:"Osu, Accra", categories:["Fashion"], description:"Casual sneakers and footwear with student-friendly pricing, simple sizing support and delivery around Accra.", pickup:true, delivery:true },
  { name:"QuickBite Kitchen", type:"OTHER_BUSINESS", location:"Bantama, Kumasi", categories:["Food"], description:"Fresh Ghanaian meals, snacks and drinks prepared daily for pickup and convenient seller delivery.", pickup:true, delivery:true },
  { name:"Byte Accessories", type:"OTHER_BUSINESS", location:"Circle, Accra", categories:["Electronics","Accessories"], description:"Practical mobile and computer accessories including chargers, adapters, mice, keyboards and protective gear.", pickup:true, delivery:true },
  { name:"StudyNest Tutors", type:"STUDENT_BUSINESS", university:"UPSA", location:"Madina, Accra", categories:["Services","Books"], description:"Student-focused tutoring, revision support and study resources for university courses and professional preparation.", pickup:false, delivery:true },
  { name:"Cake Corner", type:"STUDENT_BUSINESS", university:"KNUST", location:"Bomso, Kumasi", categories:["Food"], description:"Fresh cupcakes, celebration cakes and sweet treats made for birthdays, surprises and small campus events.", pickup:true, delivery:true },
  { name:"Urban Thread GH", type:"OTHER_BUSINESS", location:"East Legon, Accra", categories:["Fashion"], description:"Modern streetwear, tees, hoodies and casual pieces designed for simple everyday styling.", pickup:true, delivery:true },
  { name:"Smart Study Supplies", type:"STUDENT_BUSINESS", university:"UG", location:"Atomic, Accra", categories:["Books","Accessories"], description:"Academic supplies, notebooks, calculators and study accessories for lectures, labs and exam preparation.", pickup:true, delivery:true },
  { name:"Fresh Sip", type:"STUDENT_BUSINESS", university:"UCC", location:"Cape Coast Campus Area", categories:["Food"], description:"Cold fruit drinks, smoothies and refreshing beverages prepared for busy students and campus events.", pickup:true, delivery:true },
  { name:"PixelCraft Studio", type:"STUDENT_BUSINESS", university:"KNUST", location:"Kentinkrono, Kumasi", categories:["Services"], description:"Affordable graphic design, social media artwork, flyers and basic brand design for student businesses and events.", pickup:false, delivery:true },
  { name:"Home Comforts GH", type:"OTHER_BUSINESS", location:"Ahodwo, Kumasi", categories:["Other"], description:"Compact home, room and hostel comfort products including organizers, lighting and practical everyday items.", pickup:true, delivery:true },
  { name:"Braids & Beyond", type:"STUDENT_BUSINESS", university:"UPSA", location:"Legon Hills, Accra", categories:["Beauty","Services"], description:"Hair styling, braid appointments and selected hair-care products with flexible student-friendly booking.", pickup:true, delivery:true },
  { name:"GameNest", type:"OTHER_BUSINESS", location:"Asokwa, Kumasi", categories:["Electronics","Other"], description:"Gaming accessories, controllers, headsets and fun tech products for casual players and students.", pickup:true, delivery:true }
];

export const productsByCategory: Record<string, Array<[string, number, string]>> = {
  Food: [
    ["Chicken Fried Rice",45,"Fried rice served with seasoned chicken and fresh vegetables."],
    ["Jollof & Grilled Chicken",55,"Ghana-style jollof rice with grilled chicken and sauce."],
    ["Assorted Noodles",38,"Stir-fried noodles with vegetables and assorted protein."],
    ["Waakye Special",42,"Waakye with spaghetti, gari, egg and protein."],
    ["Beef Burger Combo",48,"Beef burger served with fries and a chilled drink."],
    ["Fresh Pineapple Juice",18,"Cold fresh pineapple juice prepared daily."],
    ["Sobolo Bottle",12,"Chilled hibiscus drink with ginger and fruit notes."],
    ["Chocolate Cupcakes",35,"Box of four soft chocolate cupcakes."],
    ["Vanilla Celebration Cake",180,"Simple iced celebration cake for birthdays and small events."],
    ["Breakfast Sandwich",25,"Toasted sandwich with egg, vegetables and sauce."]
  ],
  Electronics: [
    ["USB-C Fast Charging Cable",35,"Durable USB-C charging and data cable."],
    ["20W USB-C Charger",75,"Compact fast charger for compatible phones and accessories."],
    ["Wireless Mouse",95,"Comfortable wireless mouse for study and office use."],
    ["Bluetooth Earbuds",145,"Compact wireless earbuds with charging case."],
    ["Laptop Cooling Pad",135,"USB-powered cooling pad for laptops."],
    ["32GB USB Flash Drive",70,"Portable USB storage for assignments and media."],
    ["Phone Screen Protector",25,"Tempered glass screen protector with fitting support."],
    ["10,000mAh Power Bank",190,"Portable power bank for phones and small devices."],
    ["HDMI Cable 2m",45,"Two-metre HDMI cable for monitors, TVs and projectors."],
    ["Compact Bluetooth Speaker",125,"Portable speaker for rooms, study breaks and small gatherings."]
  ],
  Fashion: [
    ["Oversized Graphic Tee",120,"Relaxed-fit graphic T-shirt in multiple sizes."],
    ["Classic Plain Hoodie",180,"Soft everyday hoodie with a clean minimal look."],
    ["Cargo Trousers",165,"Comfortable cargo trousers with utility pockets."],
    ["Campus Polo Shirt",95,"Smart casual polo shirt for everyday wear."],
    ["Canvas Sneakers",210,"Versatile casual sneakers for daily outfits."],
    ["Running Sneakers",260,"Lightweight sneakers for walking and casual exercise."],
    ["Denim Jacket",220,"Classic denim jacket for layered outfits."],
    ["Baseball Cap",65,"Adjustable casual cap in assorted colours."],
    ["Tote Bag",55,"Reusable canvas tote bag for books and essentials."],
    ["Slides",85,"Comfortable everyday slides for hostel and casual wear."]
  ],
  Beauty: [
    ["Gentle Face Cleanser",65,"Daily cleanser for a simple skincare routine."],
    ["Body Lotion",55,"Moisturizing body lotion for everyday use."],
    ["Hair Growth Oil",45,"Light hair and scalp oil blend."],
    ["Lip Gloss",28,"Everyday gloss with a smooth finish."],
    ["Sunscreen SPF 50",95,"Daily broad-spectrum facial sunscreen."],
    ["Braiding Hair Pack",40,"Braiding extension pack in popular colours."],
    ["Edge Control",38,"Styling gel for neat hair finishing."],
    ["Body Mist",70,"Light fragrance mist for everyday wear."],
    ["Face Serum",85,"Lightweight facial serum for daily skincare."],
    ["Grooming Kit",110,"Compact personal grooming set."]
  ],
  Books: [
    ["A4 Lecture Notebook",28,"Ruled notebook for lectures and revision notes."],
    ["Scientific Calculator",180,"Scientific calculator suitable for university coursework."],
    ["Past Questions Pack",35,"Compiled revision questions for selected courses."],
    ["Academic Planner",42,"Weekly planner for lectures, assignments and exams."],
    ["Graph Book",18,"Graph paper notebook for maths, engineering and science work."],
    ["Sticky Notes Set",20,"Multi-size sticky notes for revision and reminders."],
    ["Document Binding",15,"Spiral binding service for reports and assignments."],
    ["A4 Printing - 20 Pages",20,"Black-and-white printing package for twenty A4 pages."],
    ["Project Report Printing",65,"Printing and basic finishing package for project reports."],
    ["Study Flashcards",25,"Blank revision flashcards for quick study sessions."]
  ],
  Accessories: [
    ["Laptop Sleeve",95,"Padded laptop sleeve for daily campus travel."],
    ["Phone Stand",35,"Foldable desk stand for phones."],
    ["Crossbody Bag",90,"Compact crossbody bag for everyday essentials."],
    ["Reusable Water Bottle",60,"Portable refillable bottle for campus and workouts."],
    ["Key Holder",18,"Simple key holder for room and locker keys."],
    ["Smartwatch Strap",45,"Replacement strap for compatible smartwatches."],
    ["Backpack",170,"Everyday backpack with laptop and accessory compartments."],
    ["Card Holder",35,"Slim card holder for IDs and bank cards."],
    ["Umbrella",70,"Compact umbrella for campus travel."],
    ["Desk Organizer",55,"Small organizer for stationery and desk accessories."]
  ],
  Services: [
    ["Logo Design",150,"Custom logo concept and basic export files for a small brand."],
    ["Social Media Flyer",60,"Single promotional flyer designed for social media."],
    ["CV Design",80,"Clean professional CV layout and formatting service."],
    ["One-Hour Tutoring Session",70,"Focused one-hour academic tutoring session."],
    ["Assignment Formatting",45,"Document formatting, headings, references and final layout cleanup."],
    ["Presentation Design",120,"Polished slide presentation design for school or business."],
    ["Portrait Photo Session",180,"Short portrait photography session with selected edited images."],
    ["Braiding Appointment",160,"Standard braid styling appointment; extensions priced separately."],
    ["Typing Service - 10 Pages",50,"Typing and basic formatting for up to ten pages."],
    ["Business Card Design",75,"Front-and-back business card design."]
  ],
  Other: [
    ["LED Desk Lamp",85,"Compact desk lamp for reading and study."],
    ["Laundry Basket",70,"Lightweight laundry basket for hostel rooms."],
    ["Storage Box",60,"Stackable storage box for room organization."],
    ["Mini Extension Board",55,"Compact power extension board for desk use."],
    ["Bedsheet Set",140,"Simple bedsheet and pillowcase set."],
    ["Travel Mug",75,"Insulated mug for hot and cold drinks."],
    ["Room Air Freshener",30,"Compact room fragrance spray."],
    ["Gaming Controller",185,"USB game controller for compatible PCs."],
    ["Gaming Headset",220,"Over-ear gaming headset with microphone."],
    ["Card Game Set",45,"Compact multiplayer card game for social gatherings."]
  ]
};

export const reviewComments = [
  "Exactly as described and the seller was very responsive.",
  "Good value for the price. I would order again.",
  "Delivery was smooth and the item arrived in good condition.",
  "Really useful for campus. The whole process was easy.",
  "Quality was better than I expected for the price.",
  "Seller communicated well and pickup was straightforward.",
  "Everything worked fine and I had no issues with the order.",
  "Nice product and fast service.",
  "Very convenient. I would recommend this store to other students.",
  "The product was good and the seller handled the order professionally."
];

export const reportReasons = ["SPAM","FRAUD","INAPPROPRIATE","MISLEADING","HARASSMENT","OTHER"] as const;
