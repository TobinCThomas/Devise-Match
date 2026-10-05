export type DeviceDetails = Partial<{
  network: string; dimensions: string; sim: string; resolution: string; software: string;
  cardSlot: string; video: string; selfie: string; audio: string; wifi: string;
  bluetooth: string; nfc: string; usb: string; sensors: string; colors: string;
  graphics: string; ports: string;
}>;

export type Device = {
  id: string; brand: string; name: string; os: "Android" | "iOS" | "Windows" | "macOS" | "ChromeOS" | "Linux"; year: number;
  category?: "Phone" | "Laptop";
  price: number; display: string; chip: string; ram: string; storage: string;
  cameras: string; battery: string; charging: string; weight: string; durability: string;
  highlight: string; scores: Record<string, number>; details?: DeviceDetails;
  source?: "curated" | "live"; sourceLabel?: string; liveSlug?: string; image?: string;
  liveGroups?: Array<{ name: string; rows: string[][] }>;
  verifiedAt?: string;
  specSources?: Array<{ label: string; url: string }>;
};

const d = (
  id: string, brand: string, name: string, os: "Android" | "iOS", year: number,
  price: number, display: string, chip: string, ram: string, storage: string,
  cameras: string, battery: string, charging: string, weight: string, durability: string,
  highlight: string, scores: [number, number, number, number, number], details?: DeviceDetails,
): Device => ({
  id, brand, name, os, year, price, display, chip, ram, storage, cameras, battery,
  charging, weight, durability, highlight, details,
  scores: { Camera: scores[0], Battery: scores[1], Performance: scores[2], Display: scores[3], Value: scores[4] },
});

const l = (
  id: string, brand: string, name: string, os: "Windows" | "macOS" | "ChromeOS" | "Linux", year: number,
  price: number, display: string, chip: string, ram: string, storage: string, graphics: string,
  battery: string, charging: string, weight: string, durability: string, highlight: string,
  scores: [number, number, number, number, number], details?: DeviceDetails,
): Device => ({
  id, brand, name, os, year, price, display, chip, ram, storage, battery, charging, weight,
  durability, highlight, details: { ...details, graphics }, category: "Laptop", cameras: details?.selfie ?? "Webcam",
  scores: { Camera: scores[0], Battery: scores[1], Performance: scores[2], Display: scores[3], Value: scores[4] },
});

export const devices: Device[] = [
  d("s26u","Samsung","Galaxy S26 Ultra","Android",2026,1299,'6.9” QHD+ AMOLED · 120Hz',"Snapdragon 8 Elite Gen 5 for Galaxy","12–16GB","256GB–1TB","200MP + 50MP + 50MP + 10MP","5,000mAh typical","60W wired · 25W wireless","214g","IP68 · Armor Aluminum","Samsung’s 2026 camera and S Pen flagship",[9.8,9.0,9.9,9.8,7.7],{dimensions:"163.6 × 78.1 × 7.9mm",resolution:"QHD+ · 1–120Hz · 2,600 nits peak",video:"8K rear video · 4K front video",selfie:"12MP",sensors:"Ultrasonic fingerprint, accelerometer, gyro, proximity, compass, barometer",colors:"Cobalt Violet, Sky Blue, Black, White, Silver Shadow, Pink Gold; availability varies"}),
  d("s26p","Samsung","Galaxy S26+","Android",2026,1099,'6.7” QHD+ AMOLED · 120Hz',"Snapdragon 8 Elite Gen 5 for Galaxy / Exynos 2600 · regional","12GB","256–512GB","50MP + 12MP + 10MP","4,900mAh","45W wired · 20W wireless","190g","IP68","Large display without Ultra bulk",[9.1,9.2,9.8,9.6,8.0]),
  d("s26","Samsung","Galaxy S26","Android",2026,899,'6.3” AMOLED · 120Hz',"Snapdragon 8 Elite Gen 5 for Galaxy / Exynos 2600 · regional","12GB","256–512GB","50MP + 12MP + 10MP","4,300mAh","25W wired · 15W wireless","167g","IP68","Compact Galaxy flagship",[9.0,8.5,9.8,9.3,8.2]),
  d("s25u","Samsung","Galaxy S25 Ultra","Android",2025,1299,'6.9” AMOLED · 120Hz',"Snapdragon 8 Elite","12GB","256GB–1TB","200MP + 50MP + 50MP + 10MP","5,000mAh","45W wired · 15W wireless","218g","IP68 · titanium","Power-user flagship with S Pen",[9.6,8.8,9.7,9.7,7.7],{dimensions:"162.8 × 77.6 × 8.2mm",resolution:"QHD+ Dynamic AMOLED 2X",video:"8K rear video",selfie:"12MP",usb:"USB-C",sensors:"Ultrasonic fingerprint, accelerometer, gyro, proximity, compass, barometer"}),
  d("s25p","Samsung","Galaxy S25+","Android",2025,999,'6.7” AMOLED · 120Hz',"Snapdragon 8 Elite","12GB","256–512GB","50MP + 12MP + 10MP","4,900mAh","45W wired · wireless","190g","IP68","Big-screen mainstream Galaxy",[9.0,9.0,9.7,9.5,8.1]),
  d("s25","Samsung","Galaxy S25","Android",2025,799,'6.2” AMOLED · 120Hz',"Snapdragon 8 Elite","12GB","128–512GB","50MP + 12MP + 10MP","4,000mAh","25W wired · wireless","162g","IP68","Small flagship with full Galaxy AI",[8.9,8.1,9.7,9.2,8.3]),
  d("zfold6","Samsung","Galaxy Z Fold6","Android",2024,1899,'7.6” foldable AMOLED · 120Hz',"Snapdragon 8 Gen 3","12GB","256GB–1TB","50MP + 10MP + 12MP","4,400mAh","25W wired · 15W wireless","239g","IP48","Phone and tablet in one",[8.5,7.6,9.2,9.7,6.6]),
  d("zflip6","Samsung","Galaxy Z Flip6","Android",2024,1099,'6.7” foldable AMOLED · 120Hz',"Snapdragon 8 Gen 3","12GB","256–512GB","50MP + 12MP","4,000mAh","25W wired · wireless","187g","IP48","Pocketable foldable with cover screen",[8.4,7.9,9.2,9.1,7.5]),
  d("a56","Samsung","Galaxy A56 5G","Android",2025,499,'6.7” AMOLED · 120Hz',"Exynos 1580","8–12GB","128–256GB","50MP + 12MP + 5MP","5,000mAh","45W wired","198g","IP67","Long-support midrange all-rounder",[8.1,9.1,7.9,8.9,9.0]),
  d("a55","Samsung","Galaxy A55 5G","Android",2024,449,'6.6” AMOLED · 120Hz',"Exynos 1480","8–12GB","128–256GB","50MP + 12MP + 5MP","5,000mAh","25W wired","213g","IP67","Balanced midrange value",[7.8,9.0,7.5,8.8,9.2]),

  d("i17pm","Apple","iPhone 17 Pro Max","iOS",2025,1199,'6.9” OLED · ProMotion',"Apple A19 Pro","Not disclosed by Apple","256GB–2TB","48MP wide + 48MP ultrawide + 48MP telephoto","Up to 39h video · US/UAE","USB-C · MagSafe / Qi2 25W","233g · US/UAE","IP68 · aluminum unibody","Apple’s largest pro camera flagship",[9.8,9.7,10,9.8,7.8],{software:"iOS 26",resolution:"Super Retina XDR · ProMotion · Always-On",sim:"eSIM / Nano-SIM support varies by region",video:"4K Dolby Vision and ProRes workflows",selfie:"18MP Center Stage front camera",usb:"USB-C · USB 3 up to 10Gb/s",sensors:"Face ID, accelerometer, gyro, proximity, compass, barometer"}),
  d("i17p","Apple","iPhone 17 Pro","iOS",2025,1099,'6.3” OLED · ProMotion',"Apple A19 Pro","12GB","256GB–1TB","48MP Pro Fusion camera system","All-day battery","USB-C · MagSafe","204g","IP68","Compact pro iPhone",[9.7,9.0,10,9.7,8.0]),
  d("iair","Apple","iPhone Air","iOS",2025,999,'6.5” OLED · ProMotion',"Apple A19 Pro","12GB","256GB–1TB","48MP Fusion main","All-day battery","USB-C · MagSafe","165g","IP68 · titanium","Ultra-thin iPhone with pro-class chip",[8.6,8.2,9.9,9.5,7.7],{software:"iOS 26",selfie:"Center Stage front camera",sim:"eSIM",usb:"USB-C"}),
  d("i17","Apple","iPhone 17","iOS",2025,799,'6.3” OLED · ProMotion',"Apple A19","8GB","256–512GB","48MP dual Fusion camera","All-day battery","USB-C · MagSafe","177g","IP68","Mainstream iPhone with 120Hz display",[9.1,8.8,9.6,9.4,8.5]),
  d("i17e","Apple","iPhone 17e","iOS",2026,599,'6.1” OLED',"Apple A19","Not disclosed by Apple","256–512GB","48MP Fusion main","Up to 26h video","USB-C · MagSafe / Qi2 15W","169g","IP68","Lower-cost entry to current iOS",[8.3,8.5,9.5,8.2,8.8]),
  d("i16pm","Apple","iPhone 16 Pro Max","iOS",2024,1199,'6.9” OLED · 120Hz',"Apple A18 Pro","8GB","256GB–1TB","48MP + 48MP + 12MP","Up to 33h video","USB-C · MagSafe 25W","227g","IP68 · titanium","Big-screen pro video flagship",[9.6,9.4,9.8,9.6,7.8]),
  d("i16p","Apple","iPhone 16 Pro","iOS",2024,999,'6.3” OLED · 120Hz',"Apple A18 Pro","8GB","128GB–1TB","48MP + 48MP + 12MP","Up to 27h video","USB-C · MagSafe 25W","199g","IP68 · titanium","Compact pro camera system",[9.5,8.7,9.8,9.5,8.1]),
  d("i16","Apple","iPhone 16","iOS",2024,799,'6.1” OLED · 60Hz',"Apple A18","8GB","128–512GB","48MP + 12MP","Up to 22h video","USB-C · MagSafe 25W","170g","IP68","Simple, capable everyday iPhone",[8.9,8.4,9.4,8.3,8.0]),
  d("i15","Apple","iPhone 15","iOS",2023,699,'6.1” OLED · 60Hz',"Apple A16 Bionic","6GB","128–512GB","48MP + 12MP","Up to 20h video","USB-C · MagSafe 15W","171g","IP68","Affordable route into iOS",[8.7,8.1,9.0,8.1,8.4]),

  d("p10pxl","Google","Pixel 10 Pro XL","Android",2025,1199,'6.8” LTPO OLED · 120Hz',"Google Tensor G5","16GB","256GB–1TB","50MP + 48MP + 48MP","Large all-day battery","Fast wired · Pixelsnap","232g","IP68","Google AI and 100× Pro Res Zoom",[9.8,9.1,9.2,9.7,8.0],{software:"Android 16 · 7 years of updates",resolution:"Super Actua LTPO OLED · 1–120Hz",video:"4K with Video Boost",selfie:"42MP",sensors:"Fingerprint, face unlock, accelerometer, gyro, proximity, compass, barometer"}),
  d("p10p","Google","Pixel 10 Pro","Android",2025,999,'6.3” LTPO OLED · 120Hz',"Google Tensor G5","16GB","128GB–1TB","50MP + 48MP + 48MP","All-day battery","Fast wired · Pixelsnap","207g","IP68","Compact AI-first camera flagship",[9.7,8.7,9.2,9.5,8.4]),
  d("p10","Google","Pixel 10","Android",2025,799,'6.3” OLED · 120Hz',"Google Tensor G5","12GB","128–256GB","48MP + 13MP + 10.8MP","All-day battery","Fast wired · Pixelsnap","204g","IP68","Triple camera and clean Android",[9.1,8.6,9.1,9.1,8.7]),
  d("p9p","Google","Pixel 9 Pro","Android",2024,999,'6.3” OLED · 120Hz',"Google Tensor G4","16GB","128GB–1TB","50MP + 48MP + 48MP","4,700mAh","27W wired · 21W wireless","199g","IP68","Smart camera and clean Android",[9.5,8.2,8.7,9.2,8.4]),
  d("p9a","Google","Pixel 9a","Android",2025,499,'6.3” OLED · 120Hz',"Google Tensor G4","8GB","128–256GB","48MP + 13MP","5,100mAh","23W wired · wireless","186g","IP68","Flagship software at midrange price",[8.8,9.2,8.5,8.8,9.4]),

  d("op13","OnePlus","OnePlus 13","Android",2025,899,'6.82” AMOLED · 120Hz',"Snapdragon 8 Elite","12–16GB","256GB–1TB","50MP triple camera","6,000mAh","100W wired · 50W wireless","210g","IP68 / IP69","Fast, fluid and battery-focused",[8.9,9.8,9.7,9.5,9.1],{dimensions:"162.9 × 76.5 × 8.5mm",software:"OxygenOS 15 based on Android 15",resolution:"3168 × 1440",video:"4K Dolby Vision on all cameras",wifi:"Wi‑Fi 7",bluetooth:"Bluetooth 5.4",nfc:"Yes",usb:"USB-C",sensors:"Optical fingerprint, accelerometer, gyro, proximity, compass"}),
  d("op13r","OnePlus","OnePlus 13R","Android",2025,599,'6.78” AMOLED · 120Hz',"Snapdragon 8 Gen 3","12GB","256GB","50MP + 50MP + 8MP","6,000mAh","80W wired","206g","IP65","Flagship speed at a lower price",[8.5,9.8,9.4,9.2,9.5]),
  d("op12","OnePlus","OnePlus 12","Android",2024,799,'6.82” AMOLED · 120Hz',"Snapdragon 8 Gen 3","12–24GB","256GB–1TB","50MP + 64MP + 48MP","5,400mAh","100W wired · 50W wireless","220g","IP65","Fast flagship with strong telephoto",[9.0,9.4,9.2,9.5,9.0]),

  d("x15u","Xiaomi","Xiaomi 15 Ultra","Android",2025,1499,'6.73” AMOLED · 120Hz',"Snapdragon 8 Elite","16GB","512GB–1TB","50MP + 50MP + 50MP + 200MP","5,410mAh","90W wired · 80W wireless","229g","IP68","Leica-focused camera powerhouse",[9.8,9.2,9.7,9.6,7.8]),
  d("x15","Xiaomi","Xiaomi 15","Android",2025,999,'6.36” AMOLED · 120Hz',"Snapdragon 8 Elite","12–16GB","256GB–1TB","50MP triple camera","5,240mAh","90W wired · 50W wireless","191g","IP68","Compact flagship with fast charging",[9.1,9.3,9.7,9.3,8.6]),
  d("rn14p","Xiaomi","Redmi Note 14 Pro","Android",2025,399,'6.67” AMOLED · 120Hz',"Helio G100 Ultra","8–12GB","256–512GB","200MP + 8MP + 2MP","5,500mAh","45W wired","180g","IP64","High-resolution camera on a budget",[8.1,9.3,7.3,8.8,9.4]),

  d("np3","Nothing","Phone (3)","Android",2025,799,'6.67” AMOLED · 120Hz',"Snapdragon 8s Gen 4","12–16GB","256–512GB","50MP triple camera","5,150mAh","65W wired · wireless","218g","IP68","Distinctive design and clean software",[8.8,8.9,9.0,9.2,8.6]),
  d("np2a","Nothing","Phone (2a)","Android",2024,349,'6.7” AMOLED · 120Hz',"Dimensity 7200 Pro","8–12GB","128–256GB","50MP + 50MP","5,000mAh","45W wired","190g","IP54","Style-forward budget all-rounder",[8.0,9.0,7.7,8.8,9.5]),
  d("razr60u","Motorola","Razr 60 Ultra","Android",2025,1299,'7.0” foldable OLED · 165Hz',"Snapdragon 8 Elite","16GB","512GB","50MP + 50MP","4,700mAh","68W wired · wireless","199g","IP48","Large-cover-screen clamshell flagship",[8.7,8.5,9.7,9.6,7.6]),
  d("edge50p","Motorola","Edge 50 Pro","Android",2024,699,'6.7” pOLED · 144Hz',"Snapdragon 7 Gen 3","12GB","512GB","50MP + 10MP + 13MP","4,500mAh","125W wired · 50W wireless","186g","IP68","Curved display and ultra-fast charging",[8.6,8.3,8.2,9.1,8.8]),
  d("findx8p","OPPO","Find X8 Pro","Android",2024,1199,'6.78” LTPO AMOLED · 120Hz',"Dimensity 9400","16GB","512GB","50MP quad camera","5,910mAh","80W wired · 50W wireless","215g","IP68 / IP69","Dual-telephoto Hasselblad flagship",[9.6,9.5,9.6,9.5,8.0]),
  d("x200p","vivo","X200 Pro","Android",2024,1099,'6.78” LTPO AMOLED · 120Hz',"Dimensity 9400","16GB","512GB","50MP + 200MP + 50MP","6,000mAh","90W wired · wireless","223g","IP68 / IP69","ZEISS telephoto and huge battery",[9.8,9.7,9.6,9.5,8.3]),
  d("magic7p","HONOR","Magic7 Pro","Android",2025,1099,'6.8” LTPO OLED · 120Hz',"Snapdragon 8 Elite","12GB","512GB","50MP + 200MP + 50MP","5,850mAh","100W wired · 80W wireless","223g","IP68 / IP69","High-end zoom and face security",[9.5,9.6,9.7,9.5,8.4]),
  d("rog9p","ASUS","ROG Phone 9 Pro","Android",2024,1199,'6.78” AMOLED · 185Hz',"Snapdragon 8 Elite","16–24GB","512GB–1TB","50MP + 32MP + 13MP","5,800mAh","65W wired","225g","IP68","Gaming specialist with AirTriggers",[8.4,9.5,9.9,9.8,7.9]),

  d("zfold7","Samsung","Galaxy Z Fold7","Android",2025,1999,'8.0” foldable AMOLED · 120Hz',"Snapdragon 8 Elite for Galaxy","12–16GB","256GB–1TB","200MP + 12MP + 10MP","4,400mAh","25W wired · 15W wireless","215g","IP48","Ultra-thin book-style foldable with S Pen-class multitasking",[9.2,7.8,9.8,9.8,6.8]),
  d("zflip7","Samsung","Galaxy Z Flip7","Android",2025,1099,'6.9” foldable AMOLED · 120Hz',"Exynos 2500","12GB","256–512GB","50MP + 12MP","4,300mAh","25W wired · wireless","188g","IP48","Pocketable flip phone with a larger cover display",[8.7,8.3,9.0,9.3,7.7]),
  d("i16e","Apple","iPhone 16e","iOS",2025,599,'6.1” OLED · 60Hz',"Apple A18","8GB","128–512GB","48MP Fusion main","Up to 26h video","USB-C · wireless","167g","IP68","Lower-cost iPhone with current-generation performance",[8.5,8.7,9.4,8.1,8.9]),
  d("p9","Google","Pixel 9","Android",2024,799,'6.3” OLED · 120Hz',"Google Tensor G4","12GB","128–256GB","50MP + 48MP","4,700mAh","27W wired · wireless","198g","IP68","Clean Android and dependable computational photography",[9.2,8.4,8.7,9.0,8.7]),
  d("nord4","OnePlus","Nord 4","Android",2024,499,'6.74” AMOLED · 120Hz',"Snapdragon 7+ Gen 3","12–16GB","256–512GB","50MP + 8MP","5,500mAh","100W wired","199.5g","IP65","Metal-bodied midranger with fast charging",[8.1,9.5,8.7,9.0,9.4]),
  d("x14tp","Xiaomi","Xiaomi 14T Pro","Android",2024,899,'6.67” AMOLED · 144Hz',"Dimensity 9300+","12GB","256GB–1TB","50MP + 50MP + 12MP","5,000mAh","120W wired · 50W wireless","209g","IP68","High-end speed and Leica-tuned cameras",[9.1,9.0,9.5,9.5,8.8]),
  d("np3ap","Nothing","Phone (3a) Pro","Android",2025,459,'6.77” AMOLED · 120Hz',"Snapdragon 7s Gen 3","12GB","256GB","50MP + 50MP + 8MP","5,000mAh","50W wired","211g","IP64","Distinctive design with a useful periscope camera",[8.7,9.0,8.2,9.0,9.4]),
  d("edge60p","Motorola","Edge 60 Pro","Android",2025,699,'6.7” pOLED · 120Hz',"Dimensity 8350 Extreme","12GB","512GB","50MP + 10MP + 50MP","6,000mAh","90W wired · 15W wireless","186g","IP68 / IP69","Light flagship alternative with a large battery",[8.8,9.7,9.0,9.2,9.0]),
  d("findn5","OPPO","Find N5","Android",2025,1799,'8.12” foldable AMOLED · 120Hz',"Snapdragon 8 Elite","16GB","512GB","50MP + 50MP + 8MP","5,600mAh","80W wired · 50W wireless","229g","IPX6 / IPX8 / IPX9","Exceptionally thin book-style foldable",[9.0,9.2,9.7,9.8,7.0]),
  d("x200u","vivo","X200 Ultra","Android",2025,999,'6.82” LTPO AMOLED · 120Hz',"Snapdragon 8 Elite","12–16GB","256GB–1TB","50MP + 200MP + 50MP","6,000mAh","90W wired · 40W wireless","229g","IP68 / IP69","Camera-first flagship with a large telephoto sensor",[9.9,9.7,9.7,9.6,8.6]),
  d("honor400p","HONOR","400 Pro","Android",2025,799,'6.7” OLED · 120Hz',"Snapdragon 8 Gen 3","12GB","512GB","200MP + 50MP + 12MP","5,300mAh","100W wired · 50W wireless","205g","IP68 / IP69","High-resolution portrait camera and fast charging",[9.2,9.3,9.2,9.2,9.0]),
  d("zen12u","ASUS","Zenfone 12 Ultra","Android",2025,1099,'6.78” LTPO AMOLED · 144Hz',"Snapdragon 8 Elite","12–16GB","256–512GB","50MP + 32MP + 13MP","5,500mAh","65W wired · 15W wireless","220g","IP68","Performance flagship with stabilized video",[9.0,9.3,9.8,9.6,8.0]),
  d("xperia1vii","Sony","Xperia 1 VII","Android",2025,1499,'6.5” LTPO OLED · 120Hz',"Snapdragon 8 Elite","12GB","256GB + microSD","48MP + 48MP + 12MP","5,000mAh","30W wired · 15W wireless","197g","IP65 / IP68","Creator-focused controls, microSD and headphone jack",[9.3,8.9,9.7,9.4,7.2]),
  d("pura80u","HUAWEI","Pura 80 Ultra","Android",2025,1399,'6.8” LTPO OLED · 120Hz',"Kirin 9020","16GB","512GB–1TB","50MP + 50MP + 40MP","5,700mAh","100W wired · 80W wireless","233g","IP68 / IP69","Premium variable-aperture camera hardware",[9.8,9.5,8.8,9.5,7.5]),
  d("gt7p","realme","GT 7 Pro","Android",2024,799,'6.78” LTPO AMOLED · 120Hz',"Snapdragon 8 Elite","12–16GB","256GB–1TB","50MP + 50MP + 8MP","6,500mAh","120W wired","223g","IP68 / IP69","Big battery and flagship speed for less",[8.8,9.9,9.8,9.4,9.2]),
  d("fairphone6","Fairphone","Fairphone 6","Android",2025,699,'6.31” LTPO OLED · 120Hz',"Snapdragon 7s Gen 3","8GB","256GB + microSD","50MP + 13MP","4,415mAh","30W wired","193g","IP55","Modular, repairable phone with long software support",[8.2,8.2,8.1,9.0,8.7]),
  d("cmf2p","CMF","Phone 2 Pro","Android",2025,279,'6.77” AMOLED · 120Hz',"Dimensity 7300 Pro","8GB","128–256GB + microSD","50MP + 50MP + 8MP","5,000mAh","33W wired","185g","IP54","Versatile cameras and bold design at a budget price",[8.3,9.0,8.0,8.9,9.8]),

  l("mba-m4","Apple","MacBook Air 13-inch (M4)","macOS",2025,999,'13.6” Liquid Retina · 2560 × 1664',"Apple M4 · 10-core CPU","16–32GB unified memory","256GB–2TB SSD","8-core or 10-core Apple GPU","Up to 18h video playback","35W dual USB-C or 70W fast charge","1.24kg","Aluminium unibody","Silent, highly portable laptop with excellent efficiency",[8.4,9.5,9.2,9.2,8.7],{selfie:"12MP Center Stage camera",ports:"2× Thunderbolt 4 · MagSafe 3 · 3.5mm",software:"macOS",colors:"Sky Blue, Silver, Starlight, Midnight"}),
  l("surface-l7","Microsoft","Surface Laptop 7 13.8-inch","Windows",2024,999,'13.8” PixelSense Flow touch · 2304 × 1536 · 120Hz',"Snapdragon X Plus / X Elite","16–64GB LPDDR5x","256GB–1TB removable SSD","Qualcomm Adreno GPU","Up to 20h local video playback","39W or 65W Surface power supply","1.34kg","Anodized aluminium","Long-running Copilot+ laptop with a bright 3:2 touchscreen",[7.9,9.3,8.8,9.2,8.5],{selfie:"Full HD Surface Studio camera",ports:"2× USB-C / USB4 · USB-A · Surface Connect · 3.5mm",software:"Windows 11"}),
  l("x1c-g13","Lenovo","ThinkPad X1 Carbon Gen 13 Aura","Windows",2025,1699,'14” WUXGA IPS or 2.8K OLED · up to 120Hz',"Intel Core Ultra 7 Series 2","16–64GB LPDDR5x","256GB–2TB PCIe 5.0 SSD","Intel Arc integrated graphics","57Wh battery","65W USB-C GaN adapter","From 986g","MIL-STD-810H tested","Ultra-light business laptop with excellent ports and security",[8.0,8.8,9.0,9.3,7.7],{selfie:"FHD or UHD camera with IR options",ports:"2× Thunderbolt 4 · 2× USB-A · HDMI 2.1 · 3.5mm",software:"Windows 11 Pro"}),
  l("g14-2025","ASUS","ROG Zephyrus G14 (2025)","Windows",2025,1999,'14” 3K OLED · 2880 × 1800 · 120Hz',"AMD Ryzen AI 9 HX 370","32–64GB LPDDR5X","1–2TB PCIe 4.0 SSD","Up to NVIDIA GeForce RTX 5080 Laptop GPU","73Wh battery","200W adapter · USB-C charging support","Approx. 1.5kg","CNC aluminium chassis","Portable creator and gaming powerhouse with dedicated graphics",[9.8,7.8,9.8,9.7,7.5],{selfie:"1080p IR camera",ports:"USB4 · USB-C · 2× USB-A · HDMI 2.1 · microSD · 3.5mm",software:"Windows 11"}),
  l("framework13-ai","Framework","Laptop 13 (Ryzen AI 300)","Windows",2025,1099,'13.5” 3:2 · 2256 × 1504 or 2880 × 1920 · up to 120Hz',"AMD Ryzen AI 5 340 to Ryzen AI 9 HX 370","Up to 96GB DDR5","User-upgradeable NVMe SSD","Up to Radeon 890M integrated graphics","61Wh replaceable battery","60W USB-C adapter","Under 1.3kg","Modular and repairable construction","Repair-first laptop with replaceable ports, memory and mainboard",[8.5,8.7,9.1,9.0,9.2],{selfie:"1080p webcam with hardware privacy switches",ports:"4× user-selectable expansion cards · 3.5mm",software:"Windows 11 or Linux"}),
  l("xps13-9350","Dell","XPS 13 9350","Windows",2025,1099,'13.4” 2K IPS or 2.5K OLED touch',"Intel Core Ultra 7 256V / 258V","16–32GB LPDDR5x","512GB–2TB SSD","Intel Arc integrated graphics","55Wh battery","60W USB-C adapter","Approx. 1.18kg","CNC-machined aluminium","Minimal premium ultraportable with strong efficiency",[7.8,8.9,8.9,9.1,8.0],{selfie:"1080p FHD RGB + IR camera",ports:"2× Thunderbolt 4 / USB-C",software:"Windows 11"}),
  l("omnibook-flip","HP","OmniBook Ultra Flip 14","Windows",2025,1499,'14” 3K OLED touch · 2880 × 1800 · 120Hz',"Intel Core Ultra 7 / 9 200V series","16–32GB LPDDR5x","512GB–2TB PCIe NVMe SSD","Intel Arc integrated graphics","64Wh battery","65W USB-C adapter","Approx. 1.34kg","Aluminium 360° convertible","Premium 2-in-1 for creators, meetings and pen input",[8.6,8.8,8.9,9.6,7.8],{selfie:"9MP IR AI camera",ports:"2× Thunderbolt 4 · USB-C · USB-A · 3.5mm",software:"Windows 11"}),
];


const manufacturerSources: Record<string, Array<{ label: string; url: string }>> = {
  s26u: [{ label: "Samsung specs", url: "https://news.samsung.com/global/samsung-unveils-galaxy-s26-series-the-most-intuitive-galaxy-ai-phone-yet" }, { label: "Body & finishes", url: "https://www.samsung.com/uk/smartphones/galaxy-s26-ultra/" }],
  s26p: [{ label: "Samsung specs", url: "https://news.samsung.com/global/samsung-unveils-galaxy-s26-series-the-most-intuitive-galaxy-ai-phone-yet" }],
  s26: [{ label: "Samsung specs", url: "https://news.samsung.com/global/samsung-unveils-galaxy-s26-series-the-most-intuitive-galaxy-ai-phone-yet" }],
  i17e: [{ label: "Apple specs", url: "https://www.apple.com/iphone-17e/specs/" }],
  i17pm: [{ label: "Apple UAE specs", url: "https://support.apple.com/en-ae/125091" }],
};
for (const device of devices) {
  if (manufacturerSources[device.id]) {
    device.verifiedAt = "2 Oct 2026";
    device.specSources = manufacturerSources[device.id];
  }
}

export const getSpecGroups = (device: Device) => {
  if (device.liveGroups?.length) return device.liveGroups;
  if (device.category === "Laptop") return [
    { name: "Overview", rows: [["Category", "Laptop"],["Introduced", device.year ? String(device.year) : "Unconfirmed"],["Positioning", device.highlight]] },
    { name: "Platform", rows: [["Operating system", device.details?.software ?? device.os],["Processor", device.chip],["Graphics", device.details?.graphics ?? "Integrated graphics"]] },
    { name: "Memory & storage", rows: [["Memory", device.ram],["Storage", device.storage],["Card slot", device.details?.cardSlot ?? "See port specification"]] },
    { name: "Display", rows: [["Panel / size", device.display],["Resolution", device.details?.resolution ?? "Included in display specification"]] },
    { name: "Mobility", rows: [["Weight", device.weight],["Construction", device.durability],["Battery", device.battery],["Power", device.charging]] },
    { name: "Camera & audio", rows: [["Webcam", device.details?.selfie ?? device.cameras],["Audio", device.details?.audio ?? "Integrated speakers and microphones"]] },
    { name: "Connectivity", rows: [["Ports", device.details?.ports ?? device.details?.usb ?? "USB-C; configuration varies"],["Wi-Fi", device.details?.wifi ?? "Wi-Fi 6 or later"],["Bluetooth", device.details?.bluetooth ?? "Yes"]] },
    { name: "Buying note", rows: [["Reference price", device.price ? `From $${device.price}` : "Check current regional price"],["Configuration", "Processor, memory, display and storage options vary by region"]] },
  ];
  return [
    { name: "Network", rows: [["Technology", device.details?.network ?? "5G / LTE / GSM"],["SIM", device.details?.sim ?? "Nano-SIM / eSIM; availability varies by region"]] },
    { name: "Launch", rows: [["Announced", device.year ? String(device.year) : "Unconfirmed"],["Status", "Available; market availability varies"]] },
    { name: "Body", rows: [["Dimensions", device.details?.dimensions ?? "See regional manufacturer specification"],["Weight", device.weight],["Protection", device.durability]] },
    { name: "Display", rows: [["Type / size", device.display],["Resolution", device.details?.resolution ?? "High-resolution touch display"]] },
    { name: "Platform", rows: [["OS", device.details?.software ?? device.os],["Chipset", device.chip]] },
    { name: "Memory", rows: [["Card slot", device.details?.cardSlot ?? "No"],["Internal", device.storage],["RAM", device.ram]] },
    { name: "Main camera", rows: [["Modules", device.cameras],["Video", device.details?.video ?? "4K video; modes vary by model"]] },
    { name: "Selfie camera", rows: [["Camera", device.details?.selfie ?? "Front camera with portrait and video modes"]] },
    { name: "Sound", rows: [["Loudspeaker", device.details?.audio ?? "Stereo speakers"],["3.5mm jack", "No"]] },
    { name: "Communications", rows: [["WLAN", device.details?.wifi ?? "Dual-band Wi‑Fi"],["Bluetooth", device.details?.bluetooth ?? "Yes"],["NFC", device.details?.nfc ?? "Yes; market dependent"],["USB", device.details?.usb ?? "USB-C"]] },
    { name: "Features", rows: [["Sensors", device.details?.sensors ?? "Fingerprint / Face unlock, accelerometer, gyro, proximity, compass"]] },
    { name: "Battery", rows: [["Capacity / rating", device.battery],["Charging", device.charging]] },
    { name: "Misc", rows: [["Colors", device.details?.colors ?? "Multiple finishes; region dependent"],["Launch price", `From $${device.price}`],["Positioning", device.highlight]] },
  ];
};
