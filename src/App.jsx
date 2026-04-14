import { useState, useRef, useEffect } from "react";
import { supabase } from './supabase';
import { useUser, SignIn, SignUp, UserButton, useClerk } from '@clerk/react';
import "mapbox-gl/dist/mapbox-gl.css";


const STATES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];

const STATE_WILDLIFE_AGENCIES = {
  "Alabama": { name: "Alabama DCNR", hunting: "https://www.outdooralabama.com", fishing: "https://www.outdooralabama.com" },
  "Alaska": { name: "Alaska DFG", hunting: "https://www.adfg.alaska.gov", fishing: "https://www.adfg.alaska.gov" },
  "Arizona": { name: "Arizona GFD", hunting: "https://www.azgfd.com", fishing: "https://www.azgfd.com" },
  "Arkansas": { name: "Arkansas GFC", hunting: "https://www.agfc.com", fishing: "https://www.agfc.com" },
  "California": { name: "California CDFW", hunting: "https://www.wildlife.ca.gov", fishing: "https://www.wildlife.ca.gov" },
  "Colorado": { name: "Colorado CPW", hunting: "https://cpw.state.co.us", fishing: "https://cpw.state.co.us" },
  "Connecticut": { name: "Connecticut DEEP", hunting: "https://portal.ct.gov/DEEP", fishing: "https://portal.ct.gov/DEEP" },
  "Delaware": { name: "Delaware DNREC", hunting: "https://dnrec.delaware.gov", fishing: "https://dnrec.delaware.gov" },
  "Florida": { name: "Florida FWC", hunting: "https://gooutdoorsflorida.com", fishing: "https://gooutdoorsflorida.com" },
  "Georgia": { name: "Georgia DNR", hunting: "https://georgiawildlife.com", fishing: "https://georgiawildlife.com" },
  "Hawaii": { name: "Hawaii DLNR", hunting: "https://dlnr.hawaii.gov", fishing: "https://dlnr.hawaii.gov" },
  "Idaho": { name: "Idaho Fish & Game", hunting: "https://idfg.idaho.gov", fishing: "https://idfg.idaho.gov" },
  "Illinois": { name: "Illinois DNR", hunting: "https://www.dnr.illinois.gov", fishing: "https://www.dnr.illinois.gov" },
  "Indiana": { name: "Indiana DNR", hunting: "https://www.in.gov/dnr", fishing: "https://www.in.gov/dnr" },
  "Iowa": { name: "Iowa DNR", hunting: "https://www.iowadnr.gov", fishing: "https://www.iowadnr.gov" },
  "Kansas": { name: "Kansas Wildlife", hunting: "https://ksoutdoors.com", fishing: "https://ksoutdoors.com" },
  "Kentucky": { name: "Kentucky DFW", hunting: "https://fw.ky.gov", fishing: "https://fw.ky.gov" },
  "Louisiana": { name: "Louisiana WLF", hunting: "https://www.wlf.louisiana.gov", fishing: "https://www.wlf.louisiana.gov" },
  "Maine": { name: "Maine IFW", hunting: "https://www.maine.gov/ifw", fishing: "https://www.maine.gov/ifw" },
  "Maryland": { name: "Maryland DNR", hunting: "https://dnr.maryland.gov", fishing: "https://dnr.maryland.gov" },
  "Massachusetts": { name: "Massachusetts DFW", hunting: "https://www.mass.gov/masswildlife", fishing: "https://www.mass.gov/masswildlife" },
  "Michigan": { name: "Michigan DNR", hunting: "https://www.michigan.gov/dnr", fishing: "https://www.michigan.gov/dnr" },
  "Minnesota": { name: "Minnesota DNR", hunting: "https://www.dnr.state.mn.us", fishing: "https://www.dnr.state.mn.us" },
  "Mississippi": { name: "Mississippi MDWFP", hunting: "https://www.mdwfp.com", fishing: "https://www.mdwfp.com" },
  "Missouri": { name: "Missouri MDC", hunting: "https://mdc.mo.gov", fishing: "https://mdc.mo.gov" },
  "Montana": { name: "Montana FWP", hunting: "https://fwp.mt.gov", fishing: "https://fwp.mt.gov" },
  "Nebraska": { name: "Nebraska Game & Parks", hunting: "https://outdoornebraska.gov", fishing: "https://outdoornebraska.gov" },
  "Nevada": { name: "Nevada NDOW", hunting: "https://www.ndow.org", fishing: "https://www.ndow.org" },
  "New Hampshire": { name: "New Hampshire DFG", hunting: "https://www.wildlife.nh.gov", fishing: "https://www.wildlife.nh.gov" },
  "New Jersey": { name: "New Jersey DFW", hunting: "https://www.nj.gov/dep/fgw", fishing: "https://www.nj.gov/dep/fgw" },
  "New Mexico": { name: "New Mexico DGF", hunting: "https://www.wildlife.state.nm.us", fishing: "https://www.wildlife.state.nm.us" },
  "New York": { name: "New York DEC", hunting: "https://www.dec.ny.gov", fishing: "https://www.dec.ny.gov" },
  "North Carolina": { name: "North Carolina WRC", hunting: "https://www.ncwildlife.org", fishing: "https://www.ncwildlife.org" },
  "North Dakota": { name: "North Dakota GFD", hunting: "https://gf.nd.gov", fishing: "https://gf.nd.gov" },
  "Ohio": { name: "Ohio DNR", hunting: "https://ohiodnr.gov", fishing: "https://ohiodnr.gov" },
  "Oklahoma": { name: "Oklahoma DWC", hunting: "https://www.wildlifedepartment.com", fishing: "https://www.wildlifedepartment.com" },
  "Oregon": { name: "Oregon DFW", hunting: "https://myodfw.com", fishing: "https://myodfw.com" },
  "Pennsylvania": { name: "Pennsylvania GC & FC", hunting: "https://www.pgc.pa.gov", fishing: "https://www.fishandboat.com" },
  "Rhode Island": { name: "Rhode Island DEM", hunting: "https://dem.ri.gov", fishing: "https://dem.ri.gov" },
  "South Carolina": { name: "South Carolina DNR", hunting: "https://www.dnr.sc.gov", fishing: "https://www.dnr.sc.gov" },
  "South Dakota": { name: "South Dakota GFP", hunting: "https://gfp.sd.gov", fishing: "https://gfp.sd.gov" },
  "Tennessee": { name: "Tennessee TWRA", hunting: "https://www.tn.gov/twra", fishing: "https://www.tn.gov/twra" },
  "Texas": { name: "Texas Parks & Wildlife", hunting: "https://tpwd.texas.gov", fishing: "https://tpwd.texas.gov" },
  "Utah": { name: "Utah DWR", hunting: "https://wildlife.utah.gov", fishing: "https://wildlife.utah.gov" },
  "Vermont": { name: "Vermont DFW", hunting: "https://vtfishandwildlife.com", fishing: "https://vtfishandwildlife.com" },
  "Virginia": { name: "Virginia DWR", hunting: "https://dwr.virginia.gov", fishing: "https://dwr.virginia.gov" },
  "Washington": { name: "Washington WDFW", hunting: "https://wdfw.wa.gov", fishing: "https://wdfw.wa.gov" },
  "West Virginia": { name: "West Virginia DNR", hunting: "https://wvdnr.gov", fishing: "https://wvdnr.gov" },
  "Wisconsin": { name: "Wisconsin DNR", hunting: "https://dnr.wisconsin.gov", fishing: "https://dnr.wisconsin.gov" },
  "Wyoming": { name: "Wyoming GFD", hunting: "https://wgfd.wyo.gov", fishing: "https://wgfd.wyo.gov" },
};

const STATE_COORDS = {
  "Alabama": [32.81, -86.79], "Alaska": [61.37, -152.4], "Arizona": [33.73, -111.43], "Arkansas": [34.97, -92.37],
  "California": [36.12, -119.68], "Colorado": [39.06, -105.31], "Connecticut": [41.6, -72.76], "Delaware": [39.32, -75.51],
  "Florida": [27.77, -81.69], "Georgia": [33.04, -83.64], "Hawaii": [21.09, -157.5], "Idaho": [44.24, -114.48],
  "Illinois": [40.35, -88.99], "Indiana": [39.85, -86.26], "Iowa": [42.01, -93.21], "Kansas": [38.53, -96.73],
  "Kentucky": [37.67, -84.67], "Louisiana": [31.17, -91.87], "Maine": [44.69, -69.38], "Maryland": [39.06, -76.8],
  "Massachusetts": [42.23, -71.53], "Michigan": [43.33, -84.54], "Minnesota": [45.69, -93.9], "Mississippi": [32.74, -89.68],
  "Missouri": [38.46, -92.29], "Montana": [46.92, -110.45], "Nebraska": [41.13, -98.27], "Nevada": [38.31, -117.06],
  "New Hampshire": [43.45, -71.56], "New Jersey": [40.3, -74.52], "New Mexico": [34.84, -106.25], "New York": [42.17, -74.95],
  "North Carolina": [35.63, -79.81], "North Dakota": [47.53, -99.78], "Ohio": [40.39, -82.76], "Oklahoma": [35.57, -96.93],
  "Oregon": [44.57, -122.07], "Pennsylvania": [40.59, -77.21], "Rhode Island": [41.68, -71.51], "South Carolina": [33.86, -80.95],
  "South Dakota": [44.3, -99.44], "Tennessee": [35.75, -86.69], "Texas": [31.05, -97.56], "Utah": [40.15, -111.86],
  "Vermont": [44.05, -72.71], "Virginia": [37.77, -78.17], "Washington": [47.4, -121.49], "West Virginia": [38.49, -80.95],
  "Wisconsin": [44.27, -89.62], "Wyoming": [42.76, -107.3]
};

const SPECIES_ICONS = {
  "Elk": "🦌", "Whitetail Deer": "🦌", "Mule Deer": "🦌", "Moose": "🦌", "Antelope": "🦌", "Bison": "🦬",
  "Turkey": "🦃", "Pheasant": "🐦", "Quail": "🐦", "Dove": "🕊️", "Duck": "🦆", "Goose": "🪿",
  "Bear": "🐻", "Hog": "🐗", "Javelina": "🐗", "Coyote": "🐺", "Fox": "🦊", "Rabbit": "🐇", "Squirrel": "🐿️",
  "Largemouth Bass": "🐟", "Smallmouth Bass": "🐟", "Striped Bass": "🐟", "Bass": "🐟",
  "Trout": "🐟", "Walleye": "🐟", "Pike": "🐟", "Muskie": "🐟", "Catfish": "🐟",
  "Crappie": "🐟", "Bluegill": "🐟", "Perch": "🐟", "Salmon": "🐟", "Steelhead": "🐟",
  "Redfish": "🐠", "Snook": "🐠", "Tarpon": "🐠", "Flounder": "🐠", "Grouper": "🐠",
  "Snapper": "🐠", "Cobia": "🐠", "Mahi-Mahi": "🐠", "Tuna": "🐠", "Marlin": "🐠",
  "Striped Marlin": "🐠", "Shark": "🦈", "Swordfish": "🐟", "Wahoo": "🐠", "Amberjack": "🐠",
};
const SPECIES = [
  { name: "Elk", icon: "🦌", type: "hunting", desc: "Rocky Mountain & Roosevelt" },
  { name: "Whitetail Deer", icon: "🦌", type: "hunting", desc: "Most popular big game" },
  { name: "Mule Deer", icon: "🦌", type: "hunting", desc: "Western terrain specialist" },
  { name: "Turkey", icon: "🦃", type: "hunting", desc: "Spring & fall seasons" },
  { name: "Bear", icon: "🐻", type: "hunting", desc: "Black & grizzly tactics" },
  { name: "Pheasant", icon: "🐦", type: "hunting", desc: "Upland bird classic" },
  { name: "Duck", icon: "🦆", type: "hunting", desc: "Waterfowl hunting" },
  { name: "Antelope", icon: "🦌", type: "hunting", desc: "Speed & open country" },
  { name: "Bass", icon: "🐟", type: "fishing", desc: "Largemouth & smallmouth" },
  { name: "Trout", icon: "🐟", type: "fishing", desc: "Stream & lake tactics" },
  { name: "Walleye", icon: "🐟", type: "fishing", desc: "Northern lakes staple" },
  { name: "Catfish", icon: "🐟", type: "fishing", desc: "Bottom fishing tactics" },
  { name: "Pike", icon: "🐟", type: "fishing", desc: "Aggressive predator" },
  { name: "Salmon", icon: "🐟", type: "fishing", desc: "Pacific & Atlantic runs" },
  { name: "Crappie", icon: "🐟", type: "fishing", desc: "Panfish favorite" },
  { name: "Carp", icon: "🐟", type: "fishing", desc: "Fly & bait fishing" },
];

const DAILY_TIPS = [
  "Scout your hunting area at least 2 weeks before season opens to pattern animal movement.",
  "For trout fishing, match the hatch — observe what insects are on the water before choosing your fly.",
  "Wind direction matters more than scent control products. Always hunt with wind in your face.",
  "Dawn and dusk are peak feeding times for most game animals. Plan your sits accordingly.",
  "Use polarized sunglasses for fishing — they cut glare and let you see fish in shallow water.",
  "Keep a hunting journal. Recording conditions, weather, and sightings will reveal patterns over time.",
  "For elk, bugling is most effective in the first and last week of the rut in September.",
];

const GEAR_CHECKLISTS = {
  "Elk Hunt": { icon: "🦌", items: ["Rifle/bow + ammo/arrows", "Hunting license + tags", "Topo map + compass", "Quality boots (broken in)", "Merino base layers", "Insulating mid layer", "Waterproof outer shell", "Blaze orange", "Rangefinder", "Binoculars 10x42", "Bone saw + knife", "Game bags (4)", "Headlamp + batteries", "First aid kit", "Emergency shelter", "Water filter", "High calorie food", "Pack (60-80L)", "Trekking poles", "Satellite communicator"] },
  "Fishing Trip": { icon: "🎣", items: ["Rod + reel", "Fishing license", "Tackle box", "Extra line", "Polarized sunglasses", "Sun protection", "Net", "Cooler + ice", "Pliers/multi-tool", "First aid kit", "Water + snacks", "Rain gear"] },
  "Turkey Hunt": { icon: "🦃", items: ["Shotgun/bow", "Turkey calls (box, slate, mouth)", "Hunting license + tags", "Camo head to toe", "Face mask/paint", "Decoys (1-2)", "Vest with seat", "Boots", "Rangefinder", "First aid kit"] },
  "Backcountry Hunt": { icon: "🏔️", items: ["Rifle/bow + ammo/arrows", "Hunting license + tags", "Tent/bivy", "Sleeping bag (-20°F rated)", "Stove + fuel", "Water filter", "Bear canister", "Extra food (2 days extra)", "Solar charger", "Satellite communicator (mandatory)", "First aid kit", "Topo map + compass", "Emergency shelter", "Trekking poles"] },
  "Duck Hunt": { icon: "🦆", items: ["Shotgun + steel shot", "Duck/waterfowl license + stamp", "Waders", "Decoys (12-36)", "Duck calls", "Blind/cover", "Camo head to toe", "Retriever or hand retrieval plan", "Life vest", "First aid kit"] },
  "Ice Fishing": { icon: "🧊", items: ["Ice auger", "Ice fishing rod + reel", "Tip-ups", "Ice fishing shelter/shanty", "Heater + fuel", "Ice cleats", "Insulated bibs + jacket", "Hand warmers", "Bait/lures", "Bucket + scoop", "First aid kit", "Ice safety picks"] },
};

const PUBLIC_LANDS = [
  { name: "Flathead National Forest", lat: 48.15, lng: -114.2, type: "hunting", state: "Montana", species: ["Elk", "Bear", "Deer"], desc: "6M+ acres of prime big game country" },
  { name: "BLM Missouri Breaks", lat: 47.8, lng: -108.5, type: "hunting", state: "Montana", species: ["Mule Deer", "Antelope"], desc: "Rugged breaks with trophy mule deer" },
  { name: "Flathead Lake", lat: 47.87, lng: -114.12, type: "fishing", state: "Montana", species: ["Trout", "Pike", "Bass"], desc: "Largest natural freshwater lake west of Mississippi" },
  { name: "Madison River", lat: 45.65, lng: -111.6, type: "fishing", state: "Montana", species: ["Trout"], desc: "World-class blue ribbon trout fishery" },
  { name: "Sun River WMA", lat: 47.52, lng: -112.8, type: "hunting", state: "Montana", species: ["Elk", "Deer"], desc: "State WMA with exceptional elk numbers" },
  { name: "Bitterroot National Forest", lat: 46.1, lng: -114.3, type: "hunting", state: "Montana", species: ["Elk", "Deer", "Bear"], desc: "Remote wilderness elk hunting" },
  { name: "Bighorn Canyon NRA", lat: 45.1, lng: -107.9, type: "fishing", state: "Montana", species: ["Walleye", "Bass", "Trout"], desc: "Outstanding walleye fishery" },
  { name: "Missouri River", lat: 47.0, lng: -110.5, type: "fishing", state: "Montana", species: ["Trout", "Walleye"], desc: "Blue ribbon trout and walleye" },
  { name: "White River NF", lat: 39.5, lng: -107.2, type: "hunting", state: "Colorado", species: ["Elk", "Deer"], desc: "Largest elk herd in North America" },
  { name: "Blue Mesa Reservoir", lat: 38.46, lng: -107.3, type: "fishing", state: "Colorado", species: ["Trout", "Salmon"], desc: "Colorado's largest body of water" },
  { name: "South Platte River", lat: 39.4, lng: -105.2, type: "fishing", state: "Colorado", species: ["Trout"], desc: "Legendary tailwater fishery" },
  { name: "Gunnison NF", lat: 38.7, lng: -107.0, type: "hunting", state: "Colorado", species: ["Elk", "Deer", "Bear"], desc: "Trophy elk unit country" },
  { name: "Spinney Mountain Reservoir", lat: 38.9, lng: -105.6, type: "fishing", state: "Colorado", species: ["Trout"], desc: "Trophy trout fishing" },
  { name: "Bridger-Teton NF", lat: 43.5, lng: -110.5, type: "hunting", state: "Wyoming", species: ["Elk", "Moose", "Bear"], desc: "World-class elk and moose habitat" },
  { name: "Bighorn Lake", lat: 44.9, lng: -108.1, type: "fishing", state: "Wyoming", species: ["Walleye", "Bass", "Trout"], desc: "Outstanding walleye and bass fishing" },
  { name: "Shoshone NF", lat: 44.2, lng: -109.6, type: "hunting", state: "Wyoming", species: ["Elk", "Bear", "Moose"], desc: "Oldest national forest in the US" },
  { name: "North Platte River", lat: 42.1, lng: -106.8, type: "fishing", state: "Wyoming", species: ["Trout"], desc: "Blue ribbon brown trout fishery" },
  { name: "Mark Twain NF", lat: 37.1, lng: -91.8, type: "hunting", state: "Missouri", species: ["Whitetail Deer", "Turkey"], desc: "Dense hardwood forest with excellent deer" },
  { name: "Lake of the Ozarks", lat: 38.2, lng: -92.6, type: "fishing", state: "Missouri", species: ["Bass", "Catfish", "Crappie"], desc: "Premier bass fishing destination" },
  { name: "Sam Houston NF", lat: 30.7, lng: -95.5, type: "hunting", state: "Texas", species: ["Whitetail Deer", "Turkey"], desc: "East Texas public hunting land" },
  { name: "Lake Fork Reservoir", lat: 32.9, lng: -95.6, type: "fishing", state: "Texas", species: ["Bass"], desc: "Legendary big bass trophy lake" },
  { name: "Guadalupe River", lat: 29.8, lng: -98.1, type: "fishing", state: "Texas", species: ["Trout"], desc: "Texas tailwater trout fishery" },
  { name: "Caddo Lake", lat: 32.7, lng: -94.0, type: "fishing", state: "Texas", species: ["Bass", "Catfish", "Crappie"], desc: "Mysterious cypress swamp bass fishing" },
  { name: "Allegheny NF", lat: 41.7, lng: -79.0, type: "hunting", state: "Pennsylvania", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "Prime PA public hunting ground" },
  { name: "Raystown Lake", lat: 40.4, lng: -78.1, type: "fishing", state: "Pennsylvania", species: ["Walleye", "Bass", "Trout"], desc: "PA's largest reservoir" },
  { name: "Delaware River", lat: 41.2, lng: -74.9, type: "fishing", state: "Pennsylvania", species: ["Trout", "Bass", "Shad"], desc: "World-class wild brown trout" },
  { name: "Chequamegon NF", lat: 45.9, lng: -90.8, type: "hunting", state: "Wisconsin", species: ["Whitetail Deer", "Bear", "Turkey"], desc: "Excellent bear and deer density" },
  { name: "Lake Winnebago", lat: 44.0, lng: -88.4, type: "fishing", state: "Wisconsin", species: ["Walleye", "Perch", "Sturgeon"], desc: "Ice fishing sturgeon capital" },
  { name: "Flambeau River", lat: 45.7, lng: -90.5, type: "fishing", state: "Wisconsin", species: ["Walleye", "Bass", "Muskie"], desc: "Wild muskie and walleye river" },
  { name: "Tongass NF", lat: 57.0, lng: -134.0, type: "hunting", state: "Alaska", species: ["Bear", "Deer", "Moose"], desc: "World's largest national forest" },
  { name: "Kenai River", lat: 60.5, lng: -150.8, type: "fishing", state: "Alaska", species: ["Salmon", "Trout"], desc: "World-famous King Salmon fishery" },
  { name: "Kodiak Island", lat: 57.5, lng: -153.5, type: "hunting", state: "Alaska", species: ["Bear", "Deer"], desc: "Kodiak brown bear paradise" },
  { name: "Bristol Bay", lat: 58.7, lng: -157.0, type: "fishing", state: "Alaska", species: ["Salmon", "Trout"], desc: "Greatest sockeye salmon run on Earth" },
  { name: "Kisatchie NF", lat: 31.4, lng: -92.8, type: "hunting", state: "Louisiana", species: ["Whitetail Deer", "Turkey", "Hog"], desc: "Only national forest in Louisiana" },
  { name: "Toledo Bend Reservoir", lat: 31.4, lng: -93.6, type: "fishing", state: "Louisiana", species: ["Bass", "Crappie", "Catfish"], desc: "Top 10 bass lake in the US" },
  { name: "Atchafalaya Basin", lat: 30.2, lng: -91.7, type: "fishing", state: "Louisiana", species: ["Bass", "Catfish", "Crappie"], desc: "Nation's largest river swamp" },
  { name: "Chattahoochee NF", lat: 34.7, lng: -84.1, type: "hunting", state: "Georgia", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "North Georgia mountain hunting" },
  { name: "Lake Lanier", lat: 34.2, lng: -83.9, type: "fishing", state: "Georgia", species: ["Bass", "Striped Bass", "Crappie"], desc: "Metro Atlanta's premier fishing lake" },
  { name: "Okefenokee Swamp", lat: 30.7, lng: -82.3, type: "fishing", state: "Georgia", species: ["Bass", "Catfish"], desc: "Blackwater swamp bass fishing" },
  { name: "Ozark NF", lat: 35.8, lng: -93.1, type: "hunting", state: "Arkansas", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "Excellent Ozark Mountain deer hunting" },
  { name: "Bull Shoals Lake", lat: 36.4, lng: -92.6, type: "fishing", state: "Arkansas", species: ["Bass", "Walleye", "Trout"], desc: "World-class bass and trout fishing" },
  { name: "White River", lat: 35.9, lng: -92.0, type: "fishing", state: "Arkansas", species: ["Trout"], desc: "Trophy rainbow and brown trout" },
  { name: "Manistee NF", lat: 44.0, lng: -85.8, type: "hunting", state: "Michigan", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "Excellent UP deer and turkey hunting" },
  { name: "Lake St. Clair", lat: 42.4, lng: -82.7, type: "fishing", state: "Michigan", species: ["Walleye", "Bass", "Muskie"], desc: "Walleye and muskie hotspot" },
  { name: "Au Sable River", lat: 44.4, lng: -84.2, type: "fishing", state: "Michigan", species: ["Trout"], desc: "Michigan's premier trout stream" },
  { name: "Hoosier NF", lat: 38.5, lng: -86.4, type: "hunting", state: "Indiana", species: ["Whitetail Deer", "Turkey"], desc: "Indiana's only national forest" },
  { name: "Patoka Lake", lat: 38.4, lng: -86.7, type: "fishing", state: "Indiana", species: ["Bass", "Crappie", "Catfish"], desc: "Southern Indiana bass fishing" },
  { name: "Ouachita NF", lat: 34.6, lng: -93.9, type: "hunting", state: "Arkansas", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "Rugged Ouachita Mountain hunting" },
  { name: "Nantahala NF", lat: 35.2, lng: -83.6, type: "hunting", state: "North Carolina", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "Western NC mountain hunting" },
  { name: "Lake Norman", lat: 35.6, lng: -80.9, type: "fishing", state: "North Carolina", species: ["Bass", "Striped Bass", "Crappie"], desc: "NC's largest man-made lake" },
  { name: "New River", lat: 36.5, lng: -81.0, type: "fishing", state: "North Carolina", species: ["Smallmouth Bass", "Trout"], desc: "Wild smallmouth bass river" },
  { name: "George Washington NF", lat: 38.5, lng: -79.3, type: "hunting", state: "Virginia", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "1.8M acres of Appalachian hunting" },
  { name: "Claytor Lake", lat: 37.1, lng: -80.6, type: "fishing", state: "Virginia", species: ["Walleye", "Bass", "Striped Bass"], desc: "Walleye hotspot in SW Virginia" },
  { name: "Deschutes NF", lat: 44.0, lng: -121.5, type: "hunting", state: "Oregon", species: ["Elk", "Deer", "Bear"], desc: "Central Oregon elk and deer" },
  { name: "Klamath River", lat: 41.9, lng: -123.5, type: "fishing", state: "Oregon", species: ["Salmon", "Steelhead", "Trout"], desc: "Premier steelhead fishery" },
  { name: "Crater Lake", lat: 42.9, lng: -122.1, type: "fishing", state: "Oregon", species: ["Trout", "Salmon"], desc: "Deepest lake in the US — trophy trout" },
  { name: "Okanogan NF", lat: 48.5, lng: -119.5, type: "hunting", state: "Washington", species: ["Elk", "Deer", "Bear"], desc: "NE Washington big game country" },
  { name: "Columbia River", lat: 46.2, lng: -119.1, type: "fishing", state: "Washington", species: ["Salmon", "Steelhead", "Sturgeon"], desc: "World's greatest salmon river" },
  { name: "Lake Chelan", lat: 47.9, lng: -120.0, type: "fishing", state: "Washington", species: ["Trout", "Salmon"], desc: "Deep glacier lake trophy trout" },
  { name: "Plumas NF", lat: 39.9, lng: -121.0, type: "hunting", state: "California", species: ["Deer", "Bear", "Turkey"], desc: "Northern California deer and bear" },
  { name: "Shasta Lake", lat: 40.7, lng: -122.4, type: "fishing", state: "California", species: ["Bass", "Trout", "Salmon"], desc: "CA's largest reservoir" },
  { name: "Trinity River", lat: 40.7, lng: -123.4, type: "fishing", state: "California", species: ["Salmon", "Steelhead", "Trout"], desc: "Legendary steelhead run" },
  { name: "Kaibab NF", lat: 36.7, lng: -112.2, type: "hunting", state: "Arizona", species: ["Mule Deer", "Elk", "Turkey"], desc: "Trophy mule deer and elk" },
  { name: "Lake Powell", lat: 37.1, lng: -111.3, type: "fishing", state: "Arizona", species: ["Bass", "Walleye", "Catfish"], desc: "Desert canyon bass fishery" },
  { name: "Verde River", lat: 34.5, lng: -111.8, type: "fishing", state: "Arizona", species: ["Bass", "Catfish", "Trout"], desc: "AZ's longest free-flowing river" },
  { name: "Cibola NF", lat: 34.8, lng: -106.5, type: "hunting", state: "New Mexico", species: ["Elk", "Mule Deer", "Bear"], desc: "Diverse New Mexico big game" },
  { name: "Elephant Butte Lake", lat: 33.1, lng: -107.2, type: "fishing", state: "New Mexico", species: ["Bass", "Walleye", "Catfish"], desc: "NM's largest reservoir" },
  { name: "Sawtooth NF", lat: 44.0, lng: -114.8, type: "hunting", state: "Idaho", species: ["Elk", "Deer", "Bear"], desc: "Central Idaho wilderness hunting" },
  { name: "Snake River", lat: 43.8, lng: -116.5, type: "fishing", state: "Idaho", species: ["Trout", "Steelhead", "Salmon"], desc: "World-class steelhead and trout" },
  { name: "Clearwater NF", lat: 46.5, lng: -115.0, type: "hunting", state: "Idaho", species: ["Elk", "Deer", "Bear"], desc: "Remote elk wilderness" },
  { name: "Huron-Manistee NF", lat: 44.3, lng: -85.5, type: "hunting", state: "Michigan", species: ["Whitetail Deer", "Bear", "Turkey"], desc: "Lower Peninsula prime hunting" },
  { name: "Boundary Waters BWCA", lat: 48.0, lng: -91.5, type: "fishing", state: "Minnesota", species: ["Walleye", "Pike", "Bass", "Trout"], desc: "Million acres of pristine fishing" },
  { name: "Superior NF", lat: 47.8, lng: -91.0, type: "hunting", state: "Minnesota", species: ["Moose", "Bear", "Deer"], desc: "Moose and bear country" },
  { name: "Mille Lacs Lake", lat: 46.2, lng: -93.6, type: "fishing", state: "Minnesota", species: ["Walleye", "Bass", "Perch"], desc: "Walleye capital of the world" },
  { name: "Red Lake WMA", lat: 48.0, lng: -95.0, type: "hunting", state: "Minnesota", species: ["Whitetail Deer", "Turkey", "Waterfowl"], desc: "Northwestern MN waterfowl and deer" },
  { name: "Hiawatha NF", lat: 46.1, lng: -86.5, type: "hunting", state: "Michigan", species: ["Whitetail Deer", "Bear", "Turkey"], desc: "Upper Peninsula hunting" },
  { name: "Green River", lat: 41.5, lng: -109.5, type: "fishing", state: "Utah", species: ["Trout"], desc: "Blue ribbon tailwater trout" },
  { name: "Lake Powell UT", lat: 37.0, lng: -110.8, type: "fishing", state: "Utah", species: ["Bass", "Striped Bass", "Walleye"], desc: "Massive canyon bass fishery" },
  { name: "Uinta NF", lat: 40.1, lng: -111.2, type: "hunting", state: "Utah", species: ["Elk", "Mule Deer", "Bear"], desc: "Rocky Mountain elk and deer" },
  { name: "Caribou NF", lat: 42.8, lng: -111.5, type: "hunting", state: "Idaho", species: ["Elk", "Mule Deer", "Antelope"], desc: "SE Idaho big game" },
  { name: "Chattahoochee NRA", lat: 34.0, lng: -84.4, type: "fishing", state: "Georgia", species: ["Trout"], desc: "Urban blue ribbon trout fishery" },
  { name: "Lake Texoma", lat: 33.8, lng: -96.6, type: "fishing", state: "Texas", species: ["Striped Bass", "Bass", "Catfish"], desc: "Striped bass capital of the world" },
  { name: "Sabine NF", lat: 31.4, lng: -93.9, type: "hunting", state: "Texas", species: ["Whitetail Deer", "Turkey", "Hog"], desc: "East Texas national forest" },
  { name: "Daniel Boone NF", lat: 37.5, lng: -83.8, type: "hunting", state: "Kentucky", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "Eastern Kentucky mountain hunting" },
  { name: "Kentucky Lake", lat: 36.8, lng: -88.2, type: "fishing", state: "Kentucky", species: ["Bass", "Crappie", "Catfish"], desc: "World's largest man-made lake by shoreline" },
  { name: "Cumberland River", lat: 36.6, lng: -87.4, type: "fishing", state: "Tennessee", species: ["Trout", "Bass", "Walleye"], desc: "Trophy brown trout tailwater" },
  { name: "Cherokee NF", lat: 36.1, lng: -82.5, type: "hunting", state: "Tennessee", species: ["Whitetail Deer", "Turkey", "Bear"], desc: "East Tennessee mountain hunting" },
  { name: "Reelfoot Lake", lat: 36.5, lng: -89.4, type: "fishing", state: "Tennessee", species: ["Crappie", "Bass", "Catfish"], desc: "Premier crappie fishing" },
  { name: "Tonto NF", lat: 33.8, lng: -111.2, type: "hunting", state: "Arizona", species: ["Mule Deer", "Elk", "Javelina"], desc: "Arizona's largest national forest" },
  { name: "Lake Pleasant", lat: 33.8, lng: -112.3, type: "fishing", state: "Arizona", species: ["Bass", "Striped Bass", "Catfish"], desc: "Phoenix metro bass fishing" },
];

const FREE_LIMIT = 5;

// ─── SVG NATURE DECORATIONS ───────────────────────────────────────────────────
const DeerSVG = ({ style: s = {} }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...s }}>
    <g opacity="0.08" fill="currentColor">
      <ellipse cx="50" cy="72" rx="22" ry="14" />
      <rect x="44" y="58" width="5" height="20" rx="2.5" />
      <rect x="51" y="58" width="5" height="20" rx="2.5" />
      <rect x="40" y="65" width="4" height="14" rx="2" />
      <rect x="56" y="65" width="4" height="14" rx="2" />
      <ellipse cx="50" cy="52" rx="14" ry="10" />
      <ellipse cx="50" cy="40" rx="8" ry="6" />
      <path d="M42 36 C40 28 36 20 38 14 C40 10 43 12 44 18 C45 22 44 28 45 32" />
      <path d="M44 30 C43 26 44 22 46 20 C48 18 49 22 48 26" />
      <path d="M58 36 C60 28 64 20 62 14 C60 10 57 12 56 18 C55 22 56 28 55 32" />
      <path d="M56 30 C57 26 56 22 54 20 C52 18 51 22 52 26" />
      <circle cx="47" cy="38" r="1.5" />
      <circle cx="53" cy="38" r="1.5" />
      <ellipse cx="50" cy="44" rx="3" ry="2" />
    </g>
  </svg>
);

const TreeSVG = ({ style: s = {} }) => (
  <svg viewBox="0 0 70 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...s }}>
    <g opacity="0.07" fill="currentColor">
      <polygon points="35,4 6,54 64,54" />
      <polygon points="35,20 8,66 62,66" />
      <polygon points="35,38 10,82 60,82" />
      <rect x="28" y="82" width="14" height="34" rx="2" />
    </g>
  </svg>
);

const MtnSVG = ({ style: s = {} }) => (
  <svg viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...s }}>
    <g opacity="0.055" fill="currentColor">
      <polygon points="200,4 60,100 340,100" />
      <polygon points="310,18 220,100 400,100" />
      <polygon points="90,28 0,100 200,100" />
      <polygon points="175,8 163,30 187,30" fill="white" opacity="0.5" />
      <polygon points="305,21 295,38 315,38" fill="white" opacity="0.4" />
    </g>
  </svg>
);

const FireSVG = ({ style: s = {} }) => (
  <svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ ...s }}>
    <g opacity="0.1">
      <ellipse cx="30" cy="68" rx="18" ry="6" fill="#c17f24" />
      <path d="M18 68 C16 58 20 50 18 42 C16 34 12 28 16 22 C20 16 26 22 25 32 C24 38 22 44 24 52 C26 58 24 66 22 68Z" fill="#c17f24" />
      <path d="M42 68 C44 58 40 50 42 42 C44 34 48 28 44 22 C40 16 34 22 35 32 C36 38 38 44 36 52 C34 58 36 66 38 68Z" fill="#c17f24" />
      <path d="M30 62 C28 52 32 44 30 34 C28 24 24 18 27 13 C30 8 34 14 33 24 C32 32 30 40 32 48 C34 54 32 62 30 62Z" fill="#d4930a" />
      <path d="M24 56 C22 48 25 42 23 35 C21 28 18 24 20 20 C22 16 26 20 25 27 C24 32 24 38 26 44 C27 48 25 56 24 56Z" fill="#d4930a" />
      <path d="M36 56 C38 48 35 42 37 35 C39 28 42 24 40 20 C38 16 34 20 35 27 C36 32 36 38 34 44 C33 48 35 56 36 56Z" fill="#d4930a" />
    </g>
  </svg>
);

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --bg:#080f08; --bg2:#0d1a0d;
    --card:rgba(255,255,255,0.03); --card-hover:rgba(255,255,255,0.06);
    --border:rgba(255,255,255,0.07); --border-accent:rgba(120,180,80,0.25);
    --green:#78b450; --green2:#5a9a32; --green-dim:rgba(120,180,80,0.12);
    --amber:#d4930a; --amber-dim:rgba(212,147,10,0.12);
    --text:#eef5e8; --text2:rgba(238,245,232,0.6); --text3:rgba(238,245,232,0.35);
    --font-display:'Playfair Display',Georgia,serif;
    --font-body:'DM Sans',system-ui,sans-serif;
    --radius:16px; --radius-sm:10px;
  }
  body { background:var(--bg); color:var(--text); font-family:var(--font-body); }
  .grain { position:fixed; inset:0; pointer-events:none; z-index:100; opacity:0.025;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size:180px; }
  .fade-in { animation:fadeIn 0.4s ease forwards; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .slide-up { animation:slideUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0; }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  .pulse { animation:pulse 2.2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .float { animation:float 5s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  .btn-primary { background:linear-gradient(135deg,var(--green),var(--green2)); color:white; border:none;
    border-radius:var(--radius-sm); font-family:var(--font-body); font-weight:600; cursor:pointer;
    transition:all 0.2s; box-shadow:0 4px 20px rgba(120,180,80,0.3); }
  .btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 28px rgba(120,180,80,0.4); }
  .btn-ghost { background:var(--card); border:1px solid var(--border); color:var(--text2);
    border-radius:var(--radius-sm); font-family:var(--font-body); cursor:pointer; transition:all 0.2s; }
  .btn-ghost:hover { background:var(--card-hover); border-color:var(--border-accent); color:var(--text); }
  .card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); transition:all 0.2s; }
  .card:hover { background:var(--card-hover); border-color:var(--border-accent); }
  .tag { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px;
    font-size:11px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; }
  .tag-hunt { background:rgba(212,147,10,0.15); color:var(--amber); border:1px solid rgba(212,147,10,0.2); }
  .tag-fish { background:rgba(80,140,220,0.15); color:#7ab0e0; border:1px solid rgba(80,140,220,0.2); }
  select,input { font-family:var(--font-body); background:rgba(255,255,255,0.04);
    border:1px solid var(--border); color:var(--text); outline:none; transition:border-color 0.2s; }
  select:focus,input:focus { border-color:var(--border-accent); }
  select option { background:#1a2e1a; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-thumb { background:rgba(120,180,80,0.2); border-radius:4px; }
  .nav-tab { padding:8px 18px; border-radius:30px; font-size:13px; font-weight:500;
    cursor:pointer; transition:all 0.2s; border:1px solid transparent;
    font-family:var(--font-body); white-space:nowrap; }
  .nav-tab.active { background:linear-gradient(135deg,var(--green),var(--green2)); color:white; box-shadow:0 4px 16px rgba(120,180,80,0.25); }
  .nav-tab.inactive { background:var(--card); border-color:var(--border); color:var(--text3); }
  .nav-tab.inactive:hover { color:var(--text2); border-color:var(--border-accent); background:var(--card-hover); }
  .msg-bubble { line-height:1.75; font-size:14px; }
  .msg-bubble strong { color:var(--green); font-weight:600; }
  .checklist-item { display:flex; align-items:center; gap:12px; padding:11px 16px;
    border-radius:var(--radius-sm); background:rgba(255,255,255,0.03); border:1px solid var(--border);
    color:var(--text2); font-size:14px; cursor:pointer; transition:all 0.15s; user-select:none; }
  .checklist-item:hover { background:var(--green-dim); border-color:var(--border-accent); color:var(--text); }
  .checklist-item.checked { background:var(--green-dim); border-color:rgba(120,180,80,0.3); color:var(--green); text-decoration:line-through; opacity:0.6; }
  .weather-stat { display:flex; flex-direction:column; align-items:center; gap:4px; padding:16px; flex:1;
    background:rgba(255,255,255,0.03); border-radius:var(--radius-sm); border:1px solid var(--border); }
  .mapboxgl-map { height:100%; width:100%; }
  .leaflet-container { background:#0d1a0d !important; }
  .leaflet-tile { filter:brightness(0.55) saturate(0.45) hue-rotate(55deg) !important; }
  .custom-marker { background:none !important; border:none !important; }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function TypewriterText({ text, onDone }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed(""); let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else { clearInterval(iv); onDone?.(); }
    }, 7);
    return () => clearInterval(iv);
  }, [text]);
  return <span className="msg-bubble" dangerouslySetInnerHTML={{ __html: displayed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />;
}
const fmtMsg = (t) => <span className="msg-bubble" dangerouslySetInnerHTML={{ __html: t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />;

// ─── WEATHER ──────────────────────────────────────────────────────────────────
function WeatherWidget({ selectedState, weather, setWeather, locationName, setLocationName }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);

  const searchLocations = async (val) => {
    if (val.length < 3) { setSuggestions([]); return; }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=6&countrycodes=us&class=place&type=city,town,village,hamlet`);
      const data = await res.json();
      const seen = new Set();
      const unique = data.filter(s => {
        if (s.type === "house" || s.type === "building" || s.class === "building" || s.class === "highway") return false;
        const label = s.display_name.split(",").slice(0, 3).join(",").trim();
        if (seen.has(label)) return false;
        seen.add(label);
        return true;
      });
      setSuggestions(unique);
      setShowDropdown(true);
    } catch { setSuggestions([]); }
  };

  const loadWeather = async (lat, lon, name) => {
    setLoading(true); setError(null); setShowDropdown(false); setLocationName(name);
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&wind_speed_unit=mph&temperature_unit=fahrenheit&timezone=auto`);
      const d = await r.json();
      if (d.current) setWeather(d.current);
    } catch { setError("Unable to load weather."); }
    setLoading(false);
  };

  const wxIcon = (c) => { if (!c) return "🌤️"; if (c === 0) return "☀️"; if (c <= 3) return "⛅"; if (c <= 48) return "🌫️"; if (c <= 67) return "🌧️"; if (c <= 77) return "❄️"; if (c <= 82) return "🌦️"; return "⛈️"; };
  const cond = (w) => {
    if (!w) return null;
    if (w.precipitation > 0.1) return { label: "Rain/Snow — Great for tracking!", color: "var(--green)" };
    if (w.wind_speed_10m < 10 && w.temperature_2m < 50 && w.temperature_2m > 20) return { label: "Excellent hunting conditions", color: "var(--green)" };
    if (w.wind_speed_10m > 20) return { label: "High wind — animals bedded down", color: "var(--amber)" };
    if (w.temperature_2m > 70) return { label: "Warm — animals moving at night", color: "var(--amber)" };
    return { label: "Fair conditions", color: "var(--text2)" };
  };

  const c2 = weather ? cond(weather) : null;

  return (
    <div className="card fade-in" style={{ padding: 24 }}>
      <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 12 }}>LIVE WEATHER</div>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <input
          value={query}
          onChange={e => { const v = e.target.value; setQuery(v); clearTimeout(window._wt); window._wt = setTimeout(() => searchLocations(v), 300); }}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Search a location (e.g. Bozeman, MT)..."
          style={{ width: "100%", padding: "12px 16px", borderRadius: "var(--radius-sm)", fontSize: 14 }}
        />
        {showDropdown && suggestions.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#0d1a0d", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", zIndex: 100, maxHeight: 220, overflowY: "auto", marginTop: 4 }}>
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => { setQuery(s.display_name.split(",").slice(0, 2).join(",")); loadWeather(s.lat, s.lon, s.display_name.split(",").slice(0, 2).join(",")); }}
                style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, color: "var(--text2)", borderBottom: "1px solid var(--border)" }}
                onMouseEnter={e => e.target.style.background = "var(--card-hover)"}
                onMouseLeave={e => e.target.style.background = "transparent"}
              >
                {s.display_name.split(",").slice(0, 3).join(",")}
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 30, color: "var(--text3)", fontSize: 13 }} className="pulse">Loading weather...</div>}
      {error && <div style={{ color: "var(--amber)", fontSize: 13, padding: 16, textAlign: "center" }}>{error}</div>}
      {!weather && !loading && !error && (
        <div style={{ textAlign: "center", padding: 32, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌤️</div>
          Search any hunting or fishing location to get live conditions
        </div>
      )}
      {weather && !loading && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <span style={{ fontSize: 56 }}>{wxIcon(weather.weather_code)}</span>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{Math.round(weather.temperature_2m)}°F</div>
              <div style={{ color: "var(--text3)", fontSize: 13, marginTop: 4 }}>{locationName}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {[["💧", `${weather.relative_humidity_2m}%`, "Humidity"], ["💨", `${Math.round(weather.wind_speed_10m)} mph`, "Wind"], ["🌧️", `${weather.precipitation}"`, "Precip"]].map(([ic, val, lbl], i) => (
              <div key={i} className="weather-stat">
                <span style={{ fontSize: 20 }}>{ic}</span>
                <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 15 }}>{val}</span>
                <span style={{ color: "var(--text3)", fontSize: 11 }}>{lbl}</span>
              </div>
            ))}
          </div>
          {c2 && <div style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
            <span style={{ color: c2.color, fontSize: 13, fontWeight: 500 }}>🎯 {c2.label}</span>
          </div>}
        </>
      )}
    </div>
  );
}

// ─── MAP TAB ──────────────────────────────────────────────────────────────────
function MapTab({ selectedState, user, onSharePin }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markersRef = useRef([]);
  const selectedRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [mapStyle, setMapStyle] = useState("satellite");
  const [showUSFS, setShowUSFS] = useState(true);
  const [showBLM, setShowBLM] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pins, setPins] = useState([]);
  const [mapReady, setMapReady] = useState(false);
  const [dropForm, setDropForm] = useState(null);
  const [dropName, setDropName] = useState("");
  const [dropSpecies, setDropSpecies] = useState("");
  const [saving, setSaving] = useState(false);

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  const STYLES = {
    satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    terrain: "mapbox://styles/mapbox/outdoors-v12",
    street: "mapbox://styles/mapbox/dark-v11",
  };

  // Keep selectedRef in sync so marker click handlers can access current value
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const loadPins = async () => {
    if (!user) return;
    const { data } = await supabase.from("saved_pins").select("*").eq("user_id", user.id);
    setPins(data || []);
  };

  useEffect(() => { loadPins(); }, [user]);

  const addLayers = (map, usfs, blm) => {
    if (!map.getSource("usfs")) {
      map.addSource("usfs", { type: "raster", tiles: ["https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_ForestSystemBoundaries_01/MapServer/tile/{z}/{x}/{y}"], tileSize: 256 });
      map.addLayer({ id: "usfs-layer", type: "raster", source: "usfs", paint: { "raster-opacity": 0.55 }, layout: { visibility: usfs ? "visible" : "none" } });
    }
    if (!map.getSource("blm")) {
      map.addSource("blm", { type: "raster", tiles: ["https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_BLM_Only/MapServer/tile/{z}/{x}/{y}"], tileSize: 256 });
      map.addLayer({ id: "blm-layer", type: "raster", source: "blm", paint: { "raster-opacity": 0.55 }, layout: { visibility: blm ? "visible" : "none" } });
    }
  };

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      const coords = selectedState && STATE_COORDS[selectedState];
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: STYLES.satellite,
        center: coords ? [coords[1], coords[0]] : [-98.35, 39.5],
        zoom: coords ? 6 : 4,
      });
      mapInst.current = map;
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }), "top-right");
      map.on("load", () => { addLayers(map, true, true); setMapReady(true); });
      map.on("click", e => {
        if (!user) return;
        if (e.originalEvent.target.classList.contains("wildai-pin")) return;
        setDropForm({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        setDropName(""); setDropSpecies(""); setSelected(null);
      });
    });
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; setMapReady(false); } };
  }, []);

  // USFS/BLM toggles
  useEffect(() => {
    if (!mapReady || !mapInst.current) return;
    try { mapInst.current.setLayoutProperty("usfs-layer", "visibility", showUSFS ? "visible" : "none"); } catch { }
  }, [showUSFS, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapInst.current) return;
    try { mapInst.current.setLayoutProperty("blm-layer", "visibility", showBLM ? "visible" : "none"); } catch { }
  }, [showBLM, mapReady]);

  // Style change
  const changeStyle = (style) => {
    if (!mapInst.current || style === mapStyle) return;
    setMapStyle(style);
    setMapReady(false);
    mapInst.current.setStyle(STYLES[style]);
    mapInst.current.once("style.load", () => { addLayers(mapInst.current, showUSFS, showBLM); setMapReady(true); });
  };

  // Draw pins — use requestAnimationFrame to avoid lag
  useEffect(() => {
    if (!mapReady || !mapInst.current) return;
    const frame = requestAnimationFrame(() => {
      import("mapbox-gl").then(({ default: mapboxgl }) => {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        pins.filter(p => p.lat && p.lng).forEach(pin => {
          const el = document.createElement("div");
          el.className = "wildai-pin";
          el.style.cssText = "width:14px;height:14px;border-radius:50%;background:#78b450;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.6);cursor:pointer;";
          el.addEventListener("mouseenter", () => { el.style.background = "#d4930a"; });
          el.addEventListener("mouseleave", () => { el.style.background = "#78b450"; });
          el.addEventListener("click", e => {
            e.stopPropagation();
            setSelected(pin);
            setDropForm(null);
          });
          const marker = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([pin.lng, pin.lat]).addTo(mapInst.current);
          markersRef.current.push(marker);
        });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [pins, mapReady]);

  const saveDropPin = async () => {
    if (!dropName.trim() || !user) return;
    setSaving(true);
    await supabase.from("saved_pins").insert({
      user_id: user.id, name: dropName, species: dropSpecies,
      lat: dropForm.lat, lng: dropForm.lng,
      state: selectedState || "",
      location: `${dropForm.lat.toFixed(5)}, ${dropForm.lng.toFixed(5)}`,
    });
    await loadPins();
    setDropForm(null);
    setSaving(false);
  };

  const removePin = async (id) => {
    await supabase.from("saved_pins").delete().eq("id", id);
    setPins(prev => prev.filter(p => p.id !== id));
    setSelected(null);
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>🗺️ My Hunting Map</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {[["satellite", "🛰️"], ["terrain", "🏔️"], ["street", "🌙"]].map(([s, icon]) => (
              <button key={s} onClick={() => changeStyle(s)} style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: `1px solid ${mapStyle === s ? "var(--green)" : "var(--border)"}`, background: mapStyle === s ? "var(--green-dim)" : "var(--card)", color: mapStyle === s ? "var(--green)" : "var(--text3)", fontSize: 14, cursor: "pointer" }}>{icon}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "var(--text2)" }}>
            <input type="checkbox" checked={showUSFS} onChange={e => setShowUSFS(e.target.checked)} />
            <span style={{ width: 10, height: 10, background: "rgba(0,140,0,0.8)", borderRadius: 2, display: "inline-block" }} />
            National Forest
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "var(--text2)" }}>
            <input type="checkbox" checked={showBLM} onChange={e => setShowBLM(e.target.checked)} />
            <span style={{ width: 10, height: 10, background: "rgba(200,120,0,0.8)", borderRadius: 2, display: "inline-block" }} />
            BLM Land
          </label>
          <span style={{ color: "var(--text3)", fontSize: 11, marginLeft: "auto" }}>{pins.filter(p => p.lat && p.lng).length} pins</span>
        </div>
      </div>

      <div style={{ position: "relative", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
        <div ref={mapRef} style={{ height: isFullscreen ? "calc(100vh - 160px)" : 500, width: "100%" }} />
        <button onClick={() => { setIsFullscreen(f => !f); setTimeout(() => mapInst.current?.resize(), 150); }} style={{ position: "absolute", top: 10, left: 10, zIndex: 10, background: "rgba(8,15,8,0.9)", border: "1px solid var(--border)", color: "var(--text2)", borderRadius: "var(--radius-sm)", padding: "6px 12px", fontSize: 11, cursor: "pointer", backdropFilter: "blur(8px)", fontFamily: "var(--font-body)" }}>
          {isFullscreen ? "⊡ Compact" : "⊞ Expand"}
        </button>
        {user && <div style={{ position: "absolute", bottom: 10, left: 10, zIndex: 10, background: "rgba(8,15,8,0.9)", border: "1px solid var(--border)", color: "var(--text3)", borderRadius: "var(--radius-sm)", padding: "5px 10px", fontSize: 10, backdropFilter: "blur(8px)" }}>Tap map to drop a pin</div>}
      </div>

      {dropForm && user && (
        <div className="card fade-in" style={{ padding: "16px 20px" }}>
          <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 12 }}>DROP PIN · {dropForm.lat.toFixed(4)}, {dropForm.lng.toFixed(4)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input placeholder="Name this spot *" value={dropName} onChange={e => setDropName(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
            <input placeholder="Species (optional)" value={dropSpecies} onChange={e => setDropSpecies(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveDropPin} disabled={!dropName.trim() || saving} className="btn-primary" style={{ flex: 1, padding: "9px", fontSize: 13, opacity: !dropName.trim() ? 0.5 : 1 }}>{saving ? "Saving..." : "📍 Save Pin"}</button>
              <button onClick={() => setDropForm(null)} className="btn-ghost" style={{ padding: "9px 16px", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="card fade-in" style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{selected.name || "Saved Spot"}</div>
            {selected.species && <div style={{ color: "var(--green)", fontSize: 12, marginBottom: 4 }}>{selected.species}</div>}
            {selected.location && <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 8 }}>📍 {selected.location}</div>}
            {selected.photo && <img src={selected.photo} style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: "var(--radius-sm)", marginBottom: 8 }} />}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontSize: 12, fontWeight: 600 }}>Get Directions →</a>
            <button onClick={() => onSharePin(selected)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", fontSize: 12, fontFamily: "var(--font-body)", marginTop: 6, display: "block" }}>📤 Share to Community →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={() => removePin(selected.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,100,100,0.7)", fontSize: 11, padding: "4px 8px", fontFamily: "var(--font-body)" }}>🗑️ Remove</button>
            <button onClick={() => setSelected(null)} className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}>✕</button>
          </div>
        </div>
      )}

      {!user && (
        <div style={{ textAlign: "center", padding: 24, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📍</div>
          Sign in to save and drop pins on your map
        </div>
      )}

      {user && pins.filter(p => p.lat && p.lng).length === 0 && !dropForm && (
        <div style={{ textAlign: "center", padding: 20, color: "var(--text3)", fontSize: 13 }}>
          Tap anywhere on the map to drop a pin, or save spots from the Community tab
        </div>
      )}
    </div>
  );
}

// ─── COMMUNITY TAB ────────────────────────────────────────────────────────────
function CommunityTab({ selectedState, user, openSignIn, onPinSaved }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [stateFilter, setStateFilter] = useState(selectedState || "all");
  const [sortBy, setSortBy] = useState("newest");
  const [form, setForm] = useState({ species: "", location: "", caption: "", photo: "", pinLat: null, pinLng: null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [savedPinIds, setSavedPinIds] = useState(new Set());
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [expandedComments, setExpandedComments] = useState(new Set());

  const loadPosts = async () => {
    setLoading(true);
    let query = supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (stateFilter !== "all") query = query.eq("state", stateFilter);
    const { data } = await query.limit(50);
    setPosts(data || []);
    setLoading(false);
  };

  const loadLikes = async (postList) => {
    if (!postList?.length) return;
    const ids = postList.map(p => p.id);
    const { data } = await supabase.from("likes").select("post_id, user_id").in("post_id", ids);
    if (!data) return;
    const counts = {};
    ids.forEach(id => counts[id] = 0);
    data.forEach(l => { counts[l.post_id] = (counts[l.post_id] || 0) + 1; });
    setLikeCounts(counts);
    if (user) setLikedPostIds(new Set(data.filter(l => l.user_id === user.id).map(l => l.post_id)));
    const { data: commentData } = await supabase.from("comments").select("post_id").in("post_id", ids);
    if (commentData) {
      const cc = {};
      ids.forEach(id => cc[id] = 0);
      commentData.forEach(c => { cc[c.post_id] = (cc[c.post_id] || 0) + 1; });
      setCommentCounts(cc);
    }
  };

  const loadSavedPins = async () => {
    if (!user) return;
    const { data } = await supabase.from("saved_pins").select("post_id").eq("user_id", user.id);
    setSavedPinIds(new Set((data || []).map(p => p.post_id)));
  };

  useEffect(() => { loadPosts(); }, [stateFilter]);
  useEffect(() => { if (posts.length) loadLikes(posts); }, [posts, user]);
  useEffect(() => {
    if (window._sharePinToComm) {
      const pin = window._sharePinToComm;
      setForm(f => ({ ...f, location: pin.name || pin.location || "", species: pin.species || "", pinLat: pin.lat, pinLng: pin.lng }));
      setShowForm(true);
      window._sharePinToComm = null;
    }
  }, []);
  useEffect(() => { loadSavedPins(); }, [user]);

  const toggleLike = async (post) => {
    if (!user) { openSignIn(); return; }
    const liked = likedPostIds.has(post.id);
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      setLikedPostIds(prev => { const n = new Set(prev); n.delete(post.id); return n; });
      setLikeCounts(prev => ({ ...prev, [post.id]: Math.max(0, (prev[post.id] || 1) - 1) }));
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
      setLikedPostIds(prev => new Set([...prev, post.id]));
      setLikeCounts(prev => ({ ...prev, [post.id]: (prev[post.id] || 0) + 1 }));
    }
  };

  const submitPost = async () => {
    if (!form.caption && !form.photo) return;
    if (!user) { openSignIn(); return; }
    setSubmitting(true); setError(null);
    let lat = null, lng = null;
    if (form.pinLat && form.pinLng) {
      lat = form.pinLat; lng = form.pinLng;
    } else if (form.location) {
      try {
        const geo = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(form.location)}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}&country=us&limit=1`);
        const gd = await geo.json();
        if (gd.features?.[0]) { lng = gd.features[0].center[0]; lat = gd.features[0].center[1]; }
      } catch { }
    }
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      username: user.firstName || user.username || "Hunter",
      state: selectedState || "Unknown",
      species: form.species,
      location: form.location,
      caption: form.caption,
      photo: form.photo,
      lat, lng,
    });
    if (error) { setError("Failed to post. Try again."); }
    else { setForm({ species: "", location: "", caption: "", photo: "", pinLat: null, pinLng: null }); setShowForm(false); loadPosts(); }
    setSubmitting(false);
  };

  const saveToMap = async (post) => {
    if (!user) { openSignIn(); return; }
    if (savedPinIds.has(post.id)) return;
    await supabase.from("saved_pins").insert({
      user_id: user.id, post_id: post.id,
      name: post.location || post.species || "Saved Spot",
      location: post.location, species: post.species,
      photo: post.photo, lat: post.lat, lng: post.lng, state: post.state,
    });
    setSavedPinIds(prev => new Set([...prev, post.id]));
    onPinSaved?.();
    alert("📍 Saved to your map!");
  };

  const reportPost = async (postId) => {
    await supabase.from("reports").insert({ post_id: postId, reason: "User reported" });
    alert("Post reported. Thank you.");
  };

  const deletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    await supabase.from("posts").delete().eq("id", postId);
    loadPosts();
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === "top") return (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, fontFamily: "var(--font-display)" }}>Community</div>
          <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 2 }}>Hunters & anglers sharing spots</div>
        </div>
        <button onClick={() => { if (!user) { openSignIn(); return; } setShowForm(s => !s); }} className="btn-primary" style={{ padding: "9px 18px", fontSize: 13 }}>
          {showForm ? "Cancel" : "+ Post"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, flexWrap: "wrap" }}>
        <button onClick={() => setStateFilter("all")} className={`nav-tab ${stateFilter === "all" ? "active" : "inactive"}`} style={{ padding: "6px 14px", fontSize: 12, flexShrink: 0 }}>🌎 All</button>
        {selectedState && <button onClick={() => setStateFilter(selectedState)} className={`nav-tab ${stateFilter === selectedState ? "active" : "inactive"}`} style={{ padding: "6px 14px", fontSize: 12, flexShrink: 0 }}>📍 {selectedState}</button>}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button onClick={() => setSortBy("newest")} className={`nav-tab ${sortBy === "newest" ? "active" : "inactive"}`} style={{ padding: "6px 14px", fontSize: 12, flexShrink: 0 }}>🕐 New</button>
          <button onClick={() => setSortBy("top")} className={`nav-tab ${sortBy === "top" ? "active" : "inactive"}`} style={{ padding: "6px 14px", fontSize: 12, flexShrink: 0 }}>🔥 Top</button>
        </div>
      </div>

      {showForm && (
        <div className="card fade-in" style={{ padding: 20 }}>
          <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 14 }}>NEW POST</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>PHOTO</div>
              <input type="file" accept="image/*" onChange={async e => {
                const file = e.target.files[0];
                if (!file) return;
                const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
                const { data, error } = await supabase.storage.from("post-photos").upload(fileName, file, { contentType: file.type });
                if (error) { alert("Photo upload failed. Try again."); return; }
                const { data: urlData } = supabase.storage.from("post-photos").getPublicUrl(fileName);
                setForm(f => ({ ...f, photo: urlData.publicUrl }));
              }} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text2)" }} />
              {form.photo && <img src={form.photo} style={{ marginTop: 8, width: "100%", borderRadius: "var(--radius-sm)", maxHeight: 250, objectFit: "cover" }} />}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>SPECIES</div>
                <input placeholder="e.g. Elk, Trout" value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
              </div>
              <div>
                <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>LOCATION</div>
                <input placeholder="e.g. Flathead NF, Montana" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
              </div>
            </div>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>CAPTION *</div>
              <textarea placeholder="Share your experience..." value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13, minHeight: 80, resize: "vertical", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-body)" }} />
            </div>
            {error && <div style={{ color: "var(--amber)", fontSize: 13 }}>{error}</div>}
            <button onClick={submitPost} disabled={submitting || (!form.caption && !form.photo)} className="btn-primary" style={{ padding: "10px", fontSize: 14, opacity: (submitting || (!form.caption && !form.photo)) ? 0.5 : 1 }}>
              {submitting ? "Posting..." : "Share Post"}
            </button>
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14 }} className="pulse">Loading posts...</div>}

      {!loading && posts.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌲</div>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No posts yet</div>
          Be the first to share a spot in {stateFilter === "all" ? "your state" : stateFilter}!
        </div>
      )}

      {sortedPosts.map(post => {
        const likeCount = likeCounts[post.id] || 0;
        const isLiked = likedPostIds.has(post.id);
        const isHot = likeCount >= 5;
        return (
          <div key={post.id} className="card fade-in" style={{ padding: 0, overflow: "hidden", border: isHot ? "1px solid rgba(255,150,0,0.3)" : "1px solid var(--border)" }}>
            {isHot && <div style={{ background: "rgba(255,120,0,0.12)", padding: "5px 14px", fontSize: 11, color: "#ff9500", fontWeight: 700, letterSpacing: "0.05em" }}>🔥 HOT SPOT · {likeCount} likes</div>}
            {post.photo && <img src={post.photo} style={{ width: "100%", maxHeight: 300, objectFit: "cover" }} />}
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>{post.username || "Hunter"}</span>
                  <span style={{ color: "var(--text3)", fontSize: 12, marginLeft: 8 }}>{post.state}</span>
                  <span style={{ color: "var(--text3)", fontSize: 11, marginLeft: 8 }}>{new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {user?.id === post.user_id && <button onClick={() => deletePost(post.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,100,100,0.6)", fontSize: 12, padding: "2px 6px" }}>✕</button>}
                  <button onClick={() => reportPost(post.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 11, padding: "2px 6px" }}>⚑</button>
                </div>
              </div>
              {(post.species || post.location) && (
                <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  {post.species && <span style={{ background: "var(--green-dim)", border: "1px solid var(--border-accent)", color: "var(--green)", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{post.species}</span>}
                  {post.location && <span style={{ color: "var(--text2)", fontSize: 12 }}>📍 {post.location}</span>}
                </div>
              )}
              {post.caption && <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6, margin: 0, marginBottom: 10 }}>{post.caption}</p>}
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={() => toggleLike(post)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: isLiked ? "#ff9500" : "var(--text3)", fontSize: 30, padding: 0, fontFamily: "var(--font-body)" }}>
                  {isLiked ? "🔥" : "🤍"} <span style={{ fontSize: 12 }}>{likeCount > 0 ? likeCount : ""}</span>
                </button>
                <button onClick={() => setExpandedComments(prev => { const n = new Set(prev); n.has(post.id) ? n.delete(post.id) : n.add(post.id); return n; })} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "var(--text3)", fontSize: 30, padding: 0, fontFamily: "var(--font-body)" }}>
                  💬 <span style={{ fontSize: 12 }}>{commentCounts[post.id] > 0 ? commentCounts[post.id] : ""}</span>
                </button>
                {post.lat && post.lng && (
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${post.lat},${post.lng}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontSize: 12, fontWeight: 600 }}>🗺️ Directions</a>
                )}
                {post.lat && post.lng && (
                  <button onClick={() => saveToMap(post)} style={{ background: savedPinIds.has(post.id) ? "var(--green-dim)" : "rgba(255,255,255,0.04)", border: `1px solid ${savedPinIds.has(post.id) ? "var(--border-accent)" : "var(--border)"}`, color: savedPinIds.has(post.id) ? "var(--green)" : "var(--text2)", padding: "5px 12px", borderRadius: "var(--radius-sm)", fontSize: 12, cursor: savedPinIds.has(post.id) ? "default" : "pointer", fontFamily: "var(--font-body)" }}>
                    {savedPinIds.has(post.id) ? "✓ Saved" : "📍 Save to Map"}
                  </button>
                )}
              </div>
              {expandedComments.has(post.id) && (
                <PostComments postId={post.id} user={user} openSignIn={openSignIn} onCommentAdded={(delta = 1) => setCommentCounts(prev => ({ ...prev, [post.id]: Math.max(0, (prev[post.id] || 0) + delta) }))} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── POST COMMENTS ────────────────────────────────────────────────────────────
function PostComments({ postId, user, openSignIn, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    setLoading(true);
    const { data } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
    setComments(data || []);
    setLoading(false);
  };

  useEffect(() => { loadComments(); }, [postId]);

  const submit = async () => {
    if (!text.trim()) return;
    if (!user) { openSignIn(); return; }
    setSubmitting(true);
    await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      username: user.firstName || user.username || "Hunter",
      content: text.trim(),
    });
    setText("");
    await loadComments();
    onCommentAdded?.();
    setSubmitting(false);
  };

  const deleteComment = async (id) => {
    await supabase.from("comments").delete().eq("id", id);
    setComments(prev => prev.filter(c => c.id !== id));
    onCommentAdded?.(-1);
  };

  return (
    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px", background: "rgba(255,255,255,0.02)" }}>
      {loading && <div style={{ color: "var(--text3)", fontSize: 12, paddingBottom: 8 }} className="pulse">Loading comments...</div>}
      {comments.map(c => (
        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 13 }}>{c.username || "Hunter"} </span>
            <span style={{ color: "var(--text2)", fontSize: 13 }}>{c.content}</span>
            <div style={{ color: "var(--text3)", fontSize: 11, marginTop: 2 }}>{new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
          </div>
          {user?.id === c.user_id && <button onClick={() => deleteComment(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,100,100,0.5)", fontSize: 11, padding: "0 4px", flexShrink: 0 }}>✕</button>}
        </div>
      ))}
      {comments.length === 0 && !loading && <div style={{ color: "var(--text3)", fontSize: 12, marginBottom: 10 }}>No comments yet — be the first!</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Add a comment..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
          style={{ flex: 1, padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }}
        />
        <button onClick={submit} disabled={!text.trim() || submitting} className="btn-primary" style={{ padding: "7px 14px", fontSize: 13, opacity: !text.trim() ? 0.5 : 1 }}>
          {submitting ? "..." : "Post"}
        </button>
      </div>
    </div>
  );
}

// ─── HARVEST LOG TAB ──────────────────────────────────────────────────────────
function HarvestLogTab({ user, openSignIn }) {
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [logFilter, setLogFilter] = useState("all");
  const [logSort, setLogSort] = useState("newest");
  const [form, setForm] = useState({ type: "hunting", species: "", date: "", location: "", size: "", weight: "", notes: "", photo: "" });

  const loadEntries = async () => {
    if (!user) { setLoadingEntries(false); return; }
    setLoadingEntries(true);
    const { data } = await supabase.from("harvest_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setEntries(data || []);
    setLoadingEntries(false);
  };

  useEffect(() => { loadEntries(); }, [user]);

  const save = async () => {
    if (!form.species || !form.date || !user) return;
    let photoUrl = form.photo;
    if (form.photoFile) {
      const fileName = `${user.id}-${Date.now()}-${form.photoFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { data } = await supabase.storage.from("post-photos").upload(fileName, form.photoFile, { contentType: form.photoFile.type });
      if (data) {
        const { data: urlData } = supabase.storage.from("post-photos").getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }
    }
    await supabase.from("harvest_logs").insert({
      user_id: user.id,
      type: form.type,
      species: form.species,
      date: form.date,
      location: form.location,
      size: form.size,
      weight: form.weight,
      notes: form.notes,
      photo: photoUrl,
    });
    setForm({ type: "hunting", species: "", date: "", location: "", size: "", weight: "", notes: "", photo: "", photoFile: null });
    setShowForm(false);
    loadEntries();
  };

  const remove = async (id) => {
    await supabase.from("harvest_logs").delete().eq("id", id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  if (!user) return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📓</div>
      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Sign In to Use Harvest Log</div>
      <div style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>Your entries sync across all your devices.</div>
      <button onClick={openSignIn} className="btn-primary" style={{ padding: "12px 28px", fontSize: 14 }}>Sign In →</button>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, fontFamily: "var(--font-display)" }}>Harvest Log</div>
          <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 2 }}>{entries.length} entries</div>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary" style={{ padding: "9px 18px", fontSize: 13 }}>
          {showForm ? "Cancel" : "+ Log Entry"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {["all", "hunting", "fishing"].map(f => (
          <button key={f} onClick={() => setLogFilter(f)} className={`nav-tab ${logFilter === f ? "active" : "inactive"}`} style={{ padding: "6px 14px", fontSize: 12 }}>
            {f === "all" ? "All" : f === "hunting" ? "🎯 Hunting" : "🎣 Fishing"}
          </button>
        ))}
        <button onClick={() => setLogSort(s => s === "newest" ? "oldest" : "newest")} className="btn-ghost" style={{ padding: "6px 14px", fontSize: 12, marginLeft: "auto" }}>
          {logSort === "newest" ? "↓ Newest" : "↑ Oldest"}
        </button>
      </div>

      {showForm && (
        <div className="card fade-in" style={{ padding: 20 }}>
          <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 14 }}>NEW ENTRY</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>TYPE</div>
              <div style={{ display: "flex", gap: 6 }}>
                {["hunting", "fishing"].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} className={`nav-tab ${form.type === t ? "active" : "inactive"}`} style={{ padding: "5px 12px", fontSize: 11, flex: 1 }}>
                    {t === "hunting" ? "🎯" : "🎣"} {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>DATE *</div>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
            </div>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>SPECIES *</div>
              <input placeholder="e.g. Whitetail Deer" value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
            </div>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>LOCATION</div>
              <input placeholder="e.g. Flathead NF" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
            </div>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>{form.type === "fishing" ? "LENGTH (in)" : "ANTLERS/SCORE"}</div>
              <input placeholder={form.type === "fishing" ? "e.g. 18" : "e.g. 8-point"} value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
            </div>
            <div>
              <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>WEIGHT (lbs)</div>
              <input placeholder="e.g. 185" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>PHOTO</div>
            <input type="file" accept="image/*" onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              setForm(f => ({ ...f, photoFile: file, photo: URL.createObjectURL(file) }));
            }} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text2)" }} />
            {form.photo && <img src={form.photo} style={{ marginTop: 8, width: "100%", borderRadius: "var(--radius-sm)", maxHeight: 200, objectFit: "cover" }} />}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 5 }}>NOTES</div>
            <textarea placeholder="Weather conditions, tactics used, memorable details..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 13, minHeight: 70, resize: "vertical", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font-body)" }} />
          </div>
          <button onClick={save} disabled={!form.species || !form.date} className="btn-primary" style={{ width: "100%", padding: "10px", fontSize: 14, opacity: (!form.species || !form.date) ? 0.5 : 1 }}>
            Save Entry
          </button>
        </div>
      )}

      {loadingEntries && <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }} className="pulse">Loading your log...</div>}

      {!loadingEntries && entries.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📓</div>
          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Start Your Harvest Log</div>
          Log your catches and harvests to track your season
        </div>
      )}

      {[...entries]
        .filter(e => logFilter === "all" || e.type === logFilter)
        .sort((a, b) => logSort === "newest" ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at))
        .map(e => (
          <div key={e.id} className="card fade-in" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 18 }}>{e.type === "hunting" ? "🎯" : "🎣"}</span>
                  <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>{e.species}</span>
                  <span style={{ color: "var(--text3)", fontSize: 12 }}>{new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: e.notes ? 8 : 0 }}>
                  {e.location && <span style={{ color: "var(--text2)", fontSize: 12 }}>📍 {e.location}</span>}
                  {e.weight && <span style={{ color: "var(--text2)", fontSize: 12 }}>⚖️ {e.weight} lbs</span>}
                  {e.size && <span style={{ color: "var(--text2)", fontSize: 12 }}>📏 {e.size}</span>}
                </div>
                {e.notes && <div style={{ color: "var(--text3)", fontSize: 12, lineHeight: 1.6 }}>{e.notes}</div>}
                {e.photo && <img src={e.photo} style={{ marginTop: 10, width: "100%", borderRadius: "var(--radius-sm)", maxHeight: 220, objectFit: "cover" }} />}
              </div>
              <button onClick={() => remove(e.id)} className="btn-ghost" style={{ padding: "4px 10px", fontSize: 12, flexShrink: 0, color: "rgba(255,100,100,0.7)" }}>✕</button>
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── TRIP PLANNER TAB ─────────────────────────────────────────────────────────
function TripPlannerTab({ selectedState, isPro, hitLimit, messageCount, setMessageCount, onUpgrade }) {
  const [activityType, setActivityType] = useState("hunting");
  const [species, setSpecies] = useState("");
  const [duration, setDuration] = useState("3");
  const [startDate, setStartDate] = useState("");
  const [groupSize, setGroupSize] = useState("2");
  const [experience, setExperience] = useState("intermediate");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const planRef = useRef(null);

  const HUNTING_SPECIES = ["Elk", "Whitetail Deer", "Mule Deer", "Turkey", "Bear", "Pheasant", "Duck", "Antelope", "Moose", "Hog"];
  const FISHING_SPECIES = ["Largemouth Bass", "Trout", "Walleye", "Catfish", "Salmon", "Striped Bass", "Crappie", "Pike", "Redfish", "Snook", "Tarpon", "Tuna"];

  const generate = async () => {
    if (!species) return;
    if (hitLimit) return;
    setLoading(true); setError(null); setPlan(null);
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    localStorage.setItem("wildai_message_count", newCount);
    try {
      const prompt = `Create a detailed ${duration}-day ${species} ${activityType} trip plan in ${selectedState || "the US"} for a group of ${groupSize} with ${experience} experience level${startDate ? `, starting ${new Date(startDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}` : ""}.

Include:
## Trip Overview
Brief summary of the trip

## Best Locations
Top 2-3 specific public land spots to target

## Daily Schedule
Day-by-day breakdown of activities, timing, and tactics

## Gear List
Essential gear specific to this trip

## Tactics & Tips
Species-specific tactics for ${selectedState || "this region"} and this time of year

## Licenses & Tags Required
What licenses and tags are needed in ${selectedState || "this state"}

## What to Expect
Realistic expectations for success, conditions, and experience

Use **bold** for key terms. Be specific and practical.`;

      const res = await fetch("https://wildai-server.onrender.com/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], system: "You are an expert hunting and fishing trip planner with deep knowledge of public lands, tactics, and regulations across all US states. Give specific, practical, actionable trip plans." })
      });
      const d = await res.json();
      setPlan(d.reply);
    } catch { setError("Couldn't generate trip plan. Try again."); }
    setLoading(false);
  };

  const printPlan = () => {
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>WildAI Trip Plan — ${species} in ${selectedState}</title>
    <style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;color:#111;line-height:1.7}h1{color:#2a5a1a;border-bottom:2px solid #2a5a1a;padding-bottom:10px}h2{color:#2a5a1a;margin-top:28px}h3{color:#555}strong{color:#2a5a1a}p{margin:10px 0}@media print{body{margin:20px}}</style>
    </head><body>
    <h1>🦌 WildAI Trip Plan</h1>
    <p><strong>${duration}-Day ${species} ${activityType} Trip · ${selectedState}${startDate ? ` · Starting ${new Date(startDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""} · Group of ${groupSize} · ${experience} level</strong></p>
    <hr/>
    ${plan.replace(/^## (.*?)$/gm, "<h2>$1</h2>").replace(/^### (.*?)$/gm, "<h3>$1</h3>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}
    <hr/><p style="color:#888;font-size:12px">Generated by WildAI · Always verify regulations with your state wildlife agency</p>
    </body></html>`);
    w.document.close();
    w.print();
  };

  const savePlan = () => {
    const text = `WILDAI TRIP PLAN\n${duration}-Day ${species} ${activityType} Trip · ${selectedState}${startDate ? ` · Starting ${new Date(startDate + "T12:00:00").toLocaleDateString()}` : ""} · Group of ${groupSize} · ${experience} level\n${"=".repeat(60)}\n\n${plan.replace(/\*\*(.*?)\*\*/g, "$1")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `WildAI-${species}-${selectedState}-Trip-Plan.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 16 }}>PLAN YOUR TRIP</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 6 }}>ACTIVITY</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["hunting", "fishing"].map(t => (
                <button key={t} onClick={() => { setActivityType(t); setSpecies(""); }} className={`nav-tab ${activityType === t ? "active" : "inactive"}`} style={{ padding: "6px 14px", fontSize: 12, flex: 1 }}>
                  {t === "hunting" ? "🎯 Hunting" : "🎣 Fishing"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 6 }}>SPECIES</div>
            <select value={species} onChange={e => setSpecies(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
              <option value="">Select species...</option>
              {(activityType === "hunting" ? HUNTING_SPECIES : FISHING_SPECIES).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 6 }}>DURATION</div>
            <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
              {["1", "2", "3", "4", "5", "6", "7"].map(d => <option key={d} value={d}>{d} day{d !== "1" ? "s" : ""}</option>)}
            </select>
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 6 }}>START DATE</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }} />
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 6 }}>GROUP SIZE</div>
            <select value={groupSize} onChange={e => setGroupSize(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
              {["1", "2", "3", "4", "5", "6", "7", "8"].map(n => <option key={n} value={n}>{n} {n === "1" ? "person" : "people"}</option>)}
            </select>
          </div>
          <div>
            <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 6 }}>EXPERIENCE</div>
            <select value={experience} onChange={e => setExperience(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
        {!selectedState && <div style={{ color: "var(--amber)", fontSize: 12, marginBottom: 10 }}>⚠️ Go back and select your state for a more accurate plan</div>}
        {hitLimit ? (
          <div style={{ background: "linear-gradient(135deg,rgba(120,180,80,0.08),rgba(90,154,50,0.04))", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)", padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)", marginBottom: 6 }}>Upgrade to WildAI Pro</div>
            <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>You've used your free interactions. Upgrade for unlimited trip plans and more.</div>
            <button className="btn-primary" style={{ padding: "12px 28px", fontSize: 14 }} onClick={onUpgrade}>Upgrade for $4.99/month →</button>
          </div>
        ) : (
          <button onClick={generate} disabled={!species || loading} className="btn-primary" style={{ width: "100%", padding: "12px", fontSize: 14, opacity: (!species || loading) ? 0.5 : 1 }}>
            {loading ? "✨ Generating your trip plan..." : "✨ Generate Trip Plan"}
          </button>
        )}
        {error && <div style={{ color: "var(--amber)", fontSize: 13, marginTop: 10 }}>{error}</div>}
      </div>

      {loading && (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 16 }} className="float">🧭</div>
          <div style={{ color: "var(--text2)", fontSize: 14 }} className="pulse">Building your {species} trip plan...</div>
          <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 8 }}>This takes a few seconds</div>
        </div>
      )}

      {plan && !loading && (
        <div className="card fade-in" ref={planRef}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>{duration}-Day {species} Trip · {selectedState}</div>
              <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 2 }}>Group of {groupSize} · {experience} level</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={savePlan} className="btn-ghost" style={{ padding: "8px 16px", fontSize: 12 }}>💾 Save</button>
              <button onClick={printPlan} className="btn-ghost" style={{ padding: "8px 16px", fontSize: 12 }}>🖨️ Print</button>
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <div className="msg-bubble" style={{ lineHeight: 1.85 }} dangerouslySetInnerHTML={{
              __html: plan
                .replace(/^## (.*?)$/gm, "<h3 style='color:var(--green);margin:20px 0 10px;font-size:15px;font-weight:700;border-bottom:1px solid var(--border);padding-bottom:6px'>$1</h3>")
                .replace(/^### (.*?)$/gm, "<h4 style='color:var(--text);margin:14px 0 6px;font-size:13px;font-weight:700'>$1</h4>")
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\n\n/g, "</p><p style='margin-top:12px'>")
                .replace(/\n/g, "<br/>")
            }} />
          </div>
        </div>
      )}

      {!plan && !loading && (
        <div style={{ textAlign: "center", padding: 32, color: "var(--text3)", fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧭</div>
          Fill in your trip details above and hit Generate — AI will build you a complete personalized trip plan
        </div>
      )}
    </div>
  );
}

// ─── LICENSES TAB ─────────────────────────────────────────────────────────────
function LicensesTab({ selectedState }) {
  const agency = selectedState ? STATE_WILDLIFE_AGENCIES[selectedState] : null;
  if (!selectedState) return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🪪</div>
      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Select Your State</div>
      <div style={{ color: "var(--text2)", fontSize: 14 }}>Go back home and choose your state to view license options.</div>
    </div>
  );
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>STATE WILDLIFE AGENCY</div>
        <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{agency?.name}</div>
        <div style={{ color: "var(--text3)", fontSize: 13 }}>{selectedState}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <a href={agency?.hunting} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <div className="card" style={{ padding: "28px 20px", textAlign: "center", cursor: "pointer", borderColor: "rgba(212,147,10,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Hunting License</div>
            <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 16 }}>Tags, permits & stamps</div>
            <div style={{ background: "linear-gradient(135deg,var(--amber),#a06800)", color: "white", padding: "10px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600 }}>Buy Now →</div>
          </div>
        </a>
        <a href={agency?.fishing} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <div className="card" style={{ padding: "28px 20px", textAlign: "center", cursor: "pointer", borderColor: "rgba(80,140,220,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎣</div>
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Fishing License</div>
            <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 16 }}>Freshwater & saltwater</div>
            <div style={{ background: "linear-gradient(135deg,#4a90d9,#2060a0)", color: "white", padding: "10px 20px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600 }}>Buy Now →</div>
          </div>
        </a>
      </div>
      <div style={{ padding: "16px 20px", background: "var(--green-dim)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)" }}>
        <p style={{ color: "var(--green)", fontSize: 13, lineHeight: 1.7 }}>💬 Have a specific regulation question? Ask the AI in the Chat tab for more detailed info.</p>
        {STATE_WILDLIFE_AGENCIES[selectedState] && (
          <a href={STATE_WILDLIFE_AGENCIES[selectedState].hunting} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontSize: 13, fontWeight: 600, display: "inline-block", marginTop: 8 }}>
            Visit {STATE_WILDLIFE_AGENCIES[selectedState].name} for official regulations →
          </a>
        )}
      </div>
      <div style={{ padding: "16px 20px", background: "var(--amber-dim)", border: "1px solid rgba(212,147,10,0.2)", borderRadius: "var(--radius)" }}>
        <p style={{ color: "rgba(212,147,10,0.9)", fontSize: 13, lineHeight: 1.7 }}>⚠️ License requirements and fees change annually. Always verify current requirements with your state agency.</p>
      </div>
    </div>
  );
}

// ─── REGULATIONS TAB ──────────────────────────────────────────────────────────
const STATE_REGULATIONS = {
  "Alabama": {
    hunting: "Whitetail Deer: archery Oct 15–Feb 10, gun Nov 18–Feb 10. Bag limit 1 buck/day, 3 bucks/season. Turkey: spring Mar 15–Apr 30, 1 bird/day 5/season. Dove: Sep 1–Oct 30. Squirrel: year-round. Hog: year-round on private land.",
    fishing: "Largemouth Bass: 12-inch minimum, 10/day. Crappie: 9-inch minimum, 30/day. Catfish: no minimum, 25/day. Striped Bass: 15-inch minimum. No closed season on most warmwater species.",
    general: "Resident licenses: Hunting $23, Fishing $16, Combo $41. Hunter education required for all first-time hunters. Licenses available at outdooralabama.com."
  },
  "Alaska": {
    hunting: "Moose: Aug 25–Sep 25 archery, Sep 5–25 general varies by unit. Caribou: varies by unit Aug–Mar. Brown/Grizzly Bear: spring Apr–May, fall Sep–Oct. Sitka Blacktail Deer: Aug 1–Dec 31 SE Alaska. Bag limits vary significantly by unit.",
    fishing: "King Salmon: varies by river, typically May–Jul. Silver Salmon: Aug–Oct. Halibut: open May–Nov, federal permit required. Rainbow Trout: year-round most waters. Catch limits vary by drainage.",
    general: "Resident licenses: Hunting $25, Fishing $30, Combo $45. Non-resident fees much higher. Hunter education required. Always check unit-specific regulations at adfg.alaska.gov — rules vary dramatically by area."
  },
  "Arizona": {
    hunting: "Mule Deer: archery Aug 18–Sep 13, rifle Oct 9–18 varies by unit. Elk: archery Aug 21–Sep 6, rifle Oct 9–Nov 1 varies by unit. Antelope: draw tags Aug–Sep. Javelina: archery Jan, rifle Jan–Feb. Most big game requires draw tags.",
    fishing: "Trout: stocked Oct–Apr at lower elevations, year-round high country. Largemouth Bass: year-round, 13-inch minimum on some lakes. Catfish: year-round. Lake Powell walleye excellent.",
    general: "Resident licenses: Hunting $37, Fishing $37, Combo $57. License required age 10+. Hunter education required. Apply for draw tags at azgfd.com by June. OTC elk tags available in some units."
  },
  "Arkansas": {
    hunting: "Whitetail Deer: archery Sep 24–Feb 28, muzzleloader Oct 22–Nov 4, modern gun Nov 12–Dec 5. Turkey: spring Apr 11–May 14, fall Oct 1–Nov 4. Duck: follows federal framework, typically Nov–Jan. Squirrel: May–Feb.",
    fishing: "Largemouth Bass: 12-inch minimum, 10/day. White Bass: no minimum. Trout: White River and Little Red River world-class tailwaters. Catfish: no minimum. Crappie: 9-inch minimum.",
    general: "Resident licenses: Hunting $25, Fishing $16, Combo $35. Lifetime licenses available. Hunter education required. Purchase at agfc.com."
  },
  "California": {
    hunting: "Blacktail/Mule Deer: archery Jul 11–Sep 18, rifle Aug 15–Oct 25 varies by zone. Turkey: spring Mar 28–May 2, fall varies. Pheasant: Nov 7–Dec 27 in game bird areas. Dove: Sep 1–Oct 23.",
    fishing: "Trout: varies by water, most streams open last Sat Apr–Nov 15. Ocean Salmon: varies by zone and run, typically Apr–Oct. Sturgeon: report card required, slot limit 40–60 inches. Bass: year-round.",
    general: "Resident licenses: Hunting $53, Fishing $55. Ocean enhancement stamp required for salmon/steelhead. Report cards for salmon, steelhead, sturgeon, abalone. Hunter education required. Purchase at wildlife.ca.gov."
  },
  "Colorado": {
    hunting: "Elk: archery Aug 31–Sep 28, rifle Oct 12–Nov 8 varies by unit. Mule Deer: archery Aug 31–Sep 28, rifle Oct 12–Nov 8. Antelope: archery Aug 15–Sep 14, rifle Sep 15–Oct 5. Pronghorn draw recommended. OTC elk available in some units.",
    fishing: "Trout: open year-round most waters. Gold Medal rivers (South Platte, Gunnison) catch-and-release or artificial only sections. Pike: year-round. Walleye: 15-inch minimum some waters.",
    general: "Resident licenses: Hunting $31, Fishing $36, Combo $59. Hunter education required. Apply for draw tags at cpw.state.co.us by April 4. Conservation license required with all licenses."
  },
  "Connecticut": {
    hunting: "Whitetail Deer: archery Sep 15–Dec 31, shotgun Nov 18–Dec 10, muzzleloader Dec 11–31. Turkey: spring May 1–31, fall Oct 1–Nov 17. Pheasant: stocked birds Oct–Nov. Bear: no open season.",
    fishing: "Trout: stocked Apr–May, catch-and-keep. Some streams trophy sections. Bass: 12-inch minimum, open year-round. Walleye: 15-inch minimum. Ice fishing popular Jan–Feb.",
    general: "Resident licenses: Hunting $19, Fishing $28, Combo $40. Hunter education required for first-time hunters born after 1975. Purchase at ct.gov/deep."
  },
  "Delaware": {
    hunting: "Whitetail Deer: archery Sep 1–Jan 31, firearm Oct 27–Nov 26 and Dec 9–15. Turkey: spring Apr 20–May 20. Pheasant: stocked birds Nov–Jan. Dove: Sep 1–Oct 15.",
    fishing: "Striped Bass: 28-inch minimum, slot limits apply in some areas. Weakfish: 13-inch minimum. Freshwater Bass: 15-inch minimum. Tidal license covers most fishing.",
    general: "Resident licenses: Hunting $8.50, Freshwater Fishing $8.50, Tidal $8.50, Combo $20. Hunter education required. Purchase at dnrec.delaware.gov."
  },
  "Florida": {
    hunting: "Whitetail Deer: archery Jul 27–Nov 2, gun Nov 2–Jan 19 varies by zone. Turkey: spring Mar 6–Apr 20, fall varies by zone. Hog: year-round on private land, legal on WMAs during deer season. Dove: Sep 1–Oct 26.",
    fishing: "Snook: 28–33 inch slot, closed May–Aug and Dec on Atlantic, closed May–Aug on Gulf. Redfish: 18–27 inch slot, 1/day. Tarpon: catch-and-release mostly, tag required to harvest. Largemouth Bass: 12-inch minimum. Flounder: 12-inch minimum.",
    general: "Resident licenses: Hunting $17, Freshwater $17, Saltwater $17, Combo $33. Hunter education required. Snook and tarpon require separate tags. Purchase at myfwc.com."
  },
  "Georgia": {
    hunting: "Whitetail Deer: archery Sep 9–Oct 13, firearms Oct 14–Jan 14 varies by WMD. Turkey: spring Mar 22–May 15, fall varies by WMD. Dove: Sep 1–Oct 29. Hog: year-round. Bear: limited archery season.",
    fishing: "Largemouth Bass: 12-inch minimum statewide. Striped Bass: 20-inch minimum. Mountain Trout: catch-and-release only in some streams, Apr 1–Oct 31 general. Catfish: no minimum.",
    general: "Resident licenses: Hunting $15, Fishing $15, Combo $25. Hunter education required for hunters born after 1961. Purchase at georgiawildlife.com."
  },
  "Hawaii": {
    hunting: "Axis Deer: year-round on Maui and Lanai. Feral Pig: year-round in most areas. Mouflon Sheep: Lanai and Kahoolawe. Seasons and areas vary by island and division. Public access limited.",
    fishing: "Freshwater fishing license required on Oahu only ($5). No saltwater license required. Largemouth and Smallmouth Bass in reservoirs. Tucunare in some reservoirs. Shore fishing for papio, ulua year-round.",
    general: "Hunting licenses: $10–$20 depending on game. Public hunting areas require separate permits. Check DLNR for specific island regulations at dlnr.hawaii.gov. Very limited public hunting land."
  },
  "Idaho": {
    hunting: "Whitetail/Mule Deer: archery Aug 30–Sep 28, general Oct 10–Nov 20 varies by unit. Elk: archery Aug 30–Sep 28, general Oct 10–Nov 20. Some units OTC, many require draw. Bear: spring and fall seasons. Wolf: open season.",
    fishing: "Steelhead: fall run Sep–Mar on Snake and Clearwater. Spring Chinook: Apr–Jun. Trout: year-round most rivers. Kokanee: great fishing in many reservoirs Aug–Oct.",
    general: "Resident licenses: Hunting $26, Fishing $34, Combo $52. Hunter education required. Apply for controlled hunts at idfg.idaho.gov by June 5. Steelhead tags required separately."
  },
  "Illinois": {
    hunting: "Whitetail Deer: archery Oct 1–Jan 19, firearm Nov 15–17 and Dec 5–8. Turkey: spring Apr 17–May 25, fall Oct 1–Nov 1. Pheasant: Nov 1–Jan 8. Dove: Sep 1–Oct 12.",
    fishing: "Largemouth Bass: 14-inch minimum many waters. Walleye: 15-inch minimum. Catfish: no minimum, plentiful Jun–Aug. Lake Michigan Salmon: great Aug–Oct runs.",
    general: "Resident licenses: Hunting $13, Fishing $15, Combo $25. Hunter education required for hunters born after 1979. Habitat stamp required. Purchase at dnr.illinois.gov."
  },
  "Indiana": {
    hunting: "Whitetail Deer: archery Oct 1–Jan 5, firearm Nov 15–26. Turkey: spring Apr 23–May 11, fall Oct 1–Nov 3. Pheasant: Nov 1–Jan 31 in stocked areas. Dove: Sep 1–Oct 29.",
    fishing: "Largemouth Bass: 12-inch minimum. Walleye: 15-inch minimum. Catfish: excellent May–Aug. Trout: stocked in some streams Mar–May.",
    general: "Resident licenses: Hunting $17, Fishing $17, Combo $25. Hunter education required. Purchase at in.gov/dnr."
  },
  "Iowa": {
    hunting: "Whitetail Deer: archery Oct 1–Dec 5, firearm Nov 30–Dec 10 and Dec 11–19. Turkey: spring Apr 13–May 11, fall Oct 1–Nov 30. Pheasant: Oct 26–Jan 10. Duck: follows federal framework.",
    fishing: "Walleye: 15-inch minimum. Largemouth Bass: 12-inch minimum. Channel Catfish: no minimum, peak Jun–Aug. Trout: stocked spring and fall.",
    general: "Resident licenses: Hunting $26, Fishing $22, Combo $43. Hunter education required for hunters born after 1971. Purchase at iowadnr.gov."
  },
  "Kansas": {
    hunting: "Whitetail Deer: archery Sep 15–Dec 31, firearm Nov 30–Dec 12. Turkey: spring Apr 16–May 31, fall Sep 15–Oct 31. Pheasant: Nov 1–Jan 31, classic rooster hunting. Quail: Nov 1–Jan 31. Dove: Sep 1–Oct 31.",
    fishing: "Walleye: 18-inch minimum on many impoundments. Largemouth Bass: 15-inch minimum. Catfish: excellent year-round. Crappie: 10-inch minimum.",
    general: "Resident licenses: Hunting $28, Fishing $28, Combo $45. Hunter education required. Purchase at ksoutdoors.com."
  },
  "Kentucky": {
    hunting: "Whitetail Deer: archery Sep 1–Jan 16, firearm Nov 9–27. Turkey: spring Apr 13–May 12, fall Oct 1–Nov 6. Squirrel: Aug 17–Feb 28. Dove: Sep 1–Oct 15.",
    fishing: "Largemouth Bass: 12-inch minimum. Smallmouth Bass: excellent in many rivers. Trout: stocked Nov–Apr in tailwaters. Kentucky Lake and Lake Barkley: world-class bass and crappie.",
    general: "Resident licenses: Hunting $26, Fishing $23, Combo $38. Hunter education required for hunters born after 1975. Purchase at fw.ky.gov."
  },
  "Louisiana": {
    hunting: "Whitetail Deer: archery Oct 1–Feb 15, firearm Nov 4–Jan 20 varies by zone. Turkey: spring Mar 22–Apr 30. Duck: follows federal framework, typically Nov–Jan. Hog: year-round. Squirrel: May–Feb.",
    fishing: "Redfish: 16–27 inch slot, 5/day. Speckled Trout: 12-inch minimum, 25/day. Largemouth Bass: 12-inch minimum. Catfish: no minimum, year-round. Flounder: 10-inch minimum.",
    general: "Resident licenses: Hunting $15, Fishing $9, Basic Combo $15. Hunter education required. Purchase at wlf.louisiana.gov."
  },
  "Maine": {
    hunting: "Whitetail Deer: archery Oct 1–30, firearm Nov 1–30. Moose: draw only Sep 30–Oct 14. Turkey: spring May 1–31, fall Oct 1–Nov 8. Bear: Aug 26–Nov 28. Grouse: Sep 15–Dec 31.",
    fishing: "Landlocked Salmon: open year-round in many lakes, 15-inch minimum. Brook Trout: open year-round most waters. Striped Bass: 28-inch minimum. Ice fishing popular Jan–Feb.",
    general: "Resident licenses: Hunting $26, Fishing $27, Combo $43. Hunter education required for first-time hunters. Purchase at maine.gov/ifw."
  },
  "Maryland": {
    hunting: "Whitetail Deer: archery Sep 9–Jan 28, firearm Nov 25–Dec 10. Turkey: spring Apr 20–May 25, fall Oct 20–Nov 18. Dove: Sep 1–Oct 19. Waterfowl: follows federal framework.",
    fishing: "Striped Bass (Rockfish): 19-inch minimum, 2/day in season. Blue Catfish: no limit, invasive species. Crappie: 9-inch minimum. Trout stocked Mar–May. Separate tidal and nontidal licenses.",
    general: "Resident licenses: Hunting $25, Freshwater Fishing $20.50, Tidal Fishing $15. Hunter education required. Purchase at dnr.maryland.gov."
  },
  "Massachusetts": {
    hunting: "Whitetail Deer: archery Oct 5–Nov 25, shotgun Nov 28–Dec 14, primitive firearms Dec 15–31. Turkey: spring May 1–Jun 7, fall Oct 3–Nov 25. Bear: archery only limited season.",
    fishing: "Trout: stocked Apr–May, 8-inch minimum, 5/day. Striped Bass: 28-inch minimum. Bass: 12-inch minimum. Walleye: 15-inch minimum. Cod offshore popular fall.",
    general: "Resident licenses: Hunting $27.50, Fishing $27.50, Combo $40. Hunter education required for first-time hunters. Purchase at mass.gov/masswildlife."
  },
  "Michigan": {
    hunting: "Whitetail Deer: archery Oct 1–Nov 14 and Dec 1–Jan 1, firearm Nov 15–30. Turkey: spring May 1–Jun 8, fall Sep 15–Nov 14. Bear: Sep 9–Oct 26 draw tags. Pheasant: Oct 20–Nov 14 Lower Peninsula.",
    fishing: "Walleye: 15-inch minimum most waters. Salmon: Great Lakes runs Aug–Oct spectacular. Steelhead: spring and fall runs. Pike: 24-inch minimum. Muskie: 42-inch minimum.",
    general: "Resident licenses: Base $11, Deer Combo $40, Fishing $26. Hunter education required. Purchase at michigan.gov/dnr."
  },
  "Minnesota": {
    hunting: "Whitetail Deer: archery Sep 14–Dec 31, firearm Nov 8–24. Bear: Sep 1–Oct 14 draw tags. Turkey: spring Apr 16–May 31, fall Sep 15–Oct 14. Pheasant: Oct 12–Jan 1. Grouse: Sep 14–Jan 3.",
    fishing: "Walleye: 15-inch minimum statewide, 6/day. Northern Pike: 24-inch minimum some lakes. Muskie: 54-inch minimum. Bass: 14-inch minimum. Ice fishing world-class Jan–Feb.",
    general: "Resident licenses: Deer $30, Fishing $25, Small Game $15. Hunter education required for hunters born after 1979. Purchase at dnr.state.mn.us."
  },
  "Mississippi": {
    hunting: "Whitetail Deer: archery Oct 1–Jan 31, firearm Nov 18–Jan 31. Turkey: spring Mar 15–May 1, fall Oct 1–Nov 30. Dove: Sep 1–Oct 27. Squirrel: Oct 1–Feb 28. Hog: year-round.",
    fishing: "Largemouth Bass: 12-inch minimum. Catfish: no minimum, year-round. Crappie: 9-inch minimum. No closed season on most warmwater species.",
    general: "Resident licenses: Hunting $15, Fishing $9, Combo $23. Hunter education required. Purchase at mdwfp.com."
  },
  "Missouri": {
    hunting: "Whitetail Deer: archery Sep 15–Nov 15 and Dec 4–Jan 15, firearm Nov 16–26. Turkey: spring Apr 21–May 11, fall Oct 1–Nov 10. Dove: Sep 1–Nov 9. Squirrel: May 23–Feb 15.",
    fishing: "Largemouth Bass: 12-inch minimum. Trout: stocked in trout parks, $4/day additional permit. Catfish: excellent May–Aug. Crappie: 9-inch minimum.",
    general: "Resident licenses: Hunting $19, Fishing $13, Combo $29. Hunter education required for hunters born after 1967. Purchase at mdc.mo.gov."
  },
  "Montana": {
    hunting: "Whitetail/Mule Deer: archery Sep 4–Oct 19, general Oct 22–Nov 30. Elk: archery Sep 4–Oct 19, general Oct 22–Nov 30. Some units OTC, many require draw. Antelope: archery Aug 15–Oct 18, rifle Sep 15–Oct 4. Bear: spring Apr–May, fall Sep–Oct.",
    fishing: "Trout: open year-round on most rivers. Catch-and-release only on some blue ribbon waters like Madison and Beaverhead. Walleye: Missouri River excellent. Ice fishing Jan–Feb.",
    general: "Resident licenses: Conservation License $8, Deer $9, Elk $20, Fishing $36. Hunter education required. Apply for limited entry units at fwp.mt.gov by March."
  },
  "Nebraska": {
    hunting: "Whitetail Deer: archery Sep 1–Dec 31, firearm Nov 14–22. Turkey: spring Apr 16–May 31, fall Sep 15–Oct 31. Pheasant: Oct 26–Jan 31. Dove: Sep 1–Oct 19. Quail: Nov 1–Jan 31.",
    fishing: "Walleye: 15-inch minimum. Largemouth Bass: 15-inch minimum. Channel Catfish: year-round. Striped Bass: stocked in some reservoirs.",
    general: "Resident licenses: Hunting $23, Fishing $31, Combo $40. Hunter education required. Purchase at outdoornebraska.gov."
  },
  "Nevada": {
    hunting: "Mule Deer: archery Aug 8–Sep 7, rifle Oct 10–Nov 15 varies by unit. Elk: draw only, archery Aug–Sep, rifle Sep–Oct. Antelope: draw only Aug–Sep. Bighorn Sheep: draw only. Most big game requires draw.",
    fishing: "Rainbow Trout: stocked year-round in many areas. Largemouth Bass: 12-inch minimum. Catfish: year-round. Lake Mead and Lake Mohave: striped bass excellent.",
    general: "Resident licenses: Hunting $33, Fishing $40, Combo $65. Hunter education required. Apply for draw tags at ndow.org by June 1."
  },
  "New Hampshire": {
    hunting: "Whitetail Deer: archery Sep 15–Dec 15, firearm Nov 1–Dec 6. Moose: draw only Oct 15–24. Turkey: spring May 1–Jun 2, fall Sep 15–Oct 31. Bear: Sep 1–Nov 20.",
    fishing: "Brook Trout: excellent in small streams, 6-inch minimum. Landlocked Salmon: 15-inch minimum. Largemouth Bass: 14-inch minimum. Ice fishing popular Jan–Feb.",
    general: "Resident licenses: Hunting $15, Fishing $23, Combo $30. Hunter education required for hunters born after 1975. Purchase at wildlife.nh.gov."
  },
  "New Jersey": {
    hunting: "Whitetail Deer: archery Sep 9–Feb 16, firearm Dec 5–19. Turkey: spring Apr 21–May 31, fall Oct 28–Nov 22. Pheasant: stocked birds Nov–Dec. Bear: limited permit shotgun season.",
    fishing: "Largemouth Bass: 15-inch minimum. Striped Bass: 28-inch minimum, 1/day. Trout stocked Mar–May. Bluefish: no minimum, excellent fall runs.",
    general: "Resident licenses: Hunting $28, Freshwater Fishing $23, Saltwater Registry free. Hunter education required. Antlerless deer permit required separately. Purchase at nj.gov/dep/fgw."
  },
  "New Mexico": {
    hunting: "Mule Deer: archery Sep 1–Oct 1, rifle Oct 17–Nov 8 varies by unit. Elk: archery Sep 1–Oct 1, rifle Oct 17–Nov 1 varies by unit. Antelope: archery Aug 15–Sep 7, rifle Sep 22–Oct 5. Most units draw tags.",
    fishing: "Trout: open year-round most waters. San Juan River: world-class tailwater trout fishery. Bass: 12-inch minimum. Catfish: year-round.",
    general: "Resident licenses: Hunting $22, Fishing $25, Combo $43. Hunter education required. Apply for draw tags at wildlife.state.nm.us by March 20."
  },
  "New York": {
    hunting: "Whitetail Deer: archery Oct 1–Nov 19 and Dec 11–Jan 9, Southern Zone firearm Nov 20–Dec 10. Turkey: spring May 1–Jun 7, fall Oct 1–Nov 18. Bear: Sep 26–Dec 15 varies by zone. Pheasant: stocked birds Oct–Nov.",
    fishing: "Trout: Apr 1–Oct 15 general, year-round some waters. Walleye: 15-inch minimum. Bass: 12-inch minimum. Lake Ontario Salmon: excellent Aug–Oct.",
    general: "Resident licenses: Hunting $22, Fishing $25, Combo $40. Hunter education required for hunters born after 1972. Purchase at dec.ny.gov."
  },
  "North Carolina": {
    hunting: "Whitetail Deer: archery Sep 7–Jan 1, gun varies significantly by county. Turkey: spring Apr 5–May 10. Bear: limited season Oct–Nov. Regulations vary dramatically by county — always check county-specific rules.",
    fishing: "Trout: hatchery-supported waters open year-round, wild trout catch-and-release. Bass: 14-inch minimum on some designated waters. Striped Bass: 18-inch minimum.",
    general: "Resident licenses: Hunting $25, Fishing $25, Combo $40. Hunter education required. County regulations vary widely — check ncwildlife.org carefully."
  },
  "North Dakota": {
    hunting: "Whitetail Deer: archery Sep 2–Jan 5, firearm Nov 8–24. Pheasant: Oct 5–Jan 7, excellent roosters. Waterfowl: follows federal framework, some of best duck hunting in US. Antelope: draw tags Sep–Oct.",
    fishing: "Walleye: 15-inch minimum, 10/day. Northern Pike: 15-inch minimum. Smallmouth Bass: 14-inch minimum. Devils Lake: world-class walleye and perch fishing.",
    general: "Resident licenses: Deer $18, Small Game $17, Fishing $15. Hunter education required. Purchase at gf.nd.gov."
  },
  "Ohio": {
    hunting: "Whitetail Deer: archery Oct 1–Feb 2, gun Dec 2–8 and Jan 4–5. Turkey: spring Apr 21–May 25, fall Oct 14–Nov 2. Pheasant: stocked birds Nov–Jan. Dove: Sep 1–Oct 27.",
    fishing: "Walleye: 15-inch minimum Lake Erie, 13-inch inland. Largemouth Bass: 12-inch minimum. Steelhead: excellent runs Oct–Apr on Lake Erie tributaries. Muskie: 40-inch minimum.",
    general: "Resident licenses: Hunting $19, Fishing $25, Combo $35. Hunter education required for hunters born after 1966. Purchase at ohiodnr.gov."
  },
  "Oklahoma": {
    hunting: "Whitetail Deer: archery Oct 1–Jan 15, gun Nov 21–Dec 8. Turkey: spring Apr 1–May 12, fall Oct 1–Nov 10. Dove: Sep 1–Oct 29. Hog: year-round on private land. Quail: Nov 9–Feb 15.",
    fishing: "Largemouth Bass: 15-inch minimum on some lakes. Catfish: excellent year-round. Striped Bass: stocked in several reservoirs. Crappie: 10-inch minimum.",
    general: "Resident licenses: Hunting $27, Fishing $25, Combo $40. Hunter education required. Purchase at wildlifedepartment.com."
  },
  "Oregon": {
    hunting: "Blacktail/Mule Deer: archery Aug 2–Sep 14, rifle Oct 1–31 varies by unit. Elk: archery Aug 30–Sep 28, rifle Oct 1–31 varies by unit. Many units require draw. Bear: Aug 1–Nov 30. Cougar: year-round with tag.",
    fishing: "Steelhead: winter run Dec–Mar, summer run May–Oct. Chinook Salmon: varies by river. Trout: open year-round most waters. Columbia River walleye excellent.",
    general: "Resident licenses: Hunting $28, Fishing $44, Combo $57. Hunter education required. Apply for draw tags at myodfw.com by June. Tags and licenses required for salmon and steelhead."
  },
  "Pennsylvania": {
    hunting: "Whitetail Deer: archery Oct 2–Nov 14 and Dec 26–Jan 17, rifle Nov 29–Dec 12. Turkey: spring May 1–Jun 2, fall Oct 31–Nov 20. Bear: archery Oct 18–24, rifle Nov 18–22. Pheasant: Oct 17–Nov 20.",
    fishing: "Trout: stocked waters open Apr 5. Wild trout streams open year-round. Walleye: 15-inch minimum. Bass: 12-inch minimum. Lake Erie Steelhead: Oct–Apr excellent.",
    general: "Resident licenses: Hunting $20, Fishing $22.70, Combo $35. Hunter education required for hunters born after 1986. Purchase at huntfish.pa.gov."
  },
  "Rhode Island": {
    hunting: "Whitetail Deer: archery Sep 16–Jan 31, shotgun Dec 1–15. Turkey: spring May 1–Jun 3, fall Oct 1–Nov 20. Small game limited due to land availability.",
    fishing: "Striped Bass: 28-inch minimum, 1/day. Bluefish: 8 fish/day. Freshwater Bass: 12-inch minimum. Trout stocked spring. Saltwater registry free.",
    general: "Resident licenses: Hunting $18, Freshwater Fishing $18, Saltwater Registry free. Hunter education required. Purchase at dem.ri.gov."
  },
  "South Carolina": {
    hunting: "Whitetail Deer: archery Aug 15–Jan 1, firearm Aug 15–Jan 1 varies by zone. One of the longest deer seasons in the US with liberal bag limits. Turkey: spring Apr 1–May 1. Dove: Sep 1–Oct 25.",
    fishing: "Largemouth Bass: 12-inch minimum. Striped Bass: 21-inch minimum. Redfish: 15–23 inch slot, 3/day. Flounder: 12-inch minimum. Trout: 14-inch minimum.",
    general: "Resident licenses: Hunting $14, Freshwater Fishing $10, Saltwater $10. Hunter education required. Purchase at dnr.sc.gov."
  },
  "South Dakota": {
    hunting: "Pheasant: Oct 19–Jan 31, world-class ringneck hunting. Whitetail Deer: archery Sep 14–Jan 31, rifle Nov 14–Dec 8. Turkey: spring Apr 13–May 31, fall Sep 28–Jan 31. Prairie Dog: year-round.",
    fishing: "Walleye: 15-inch minimum on Missouri River reservoirs. Northern Pike: 15-inch minimum. Smallmouth Bass: excellent in Black Hills streams. Perch: popular year-round.",
    general: "Resident licenses: Small Game $28, Deer $28, Fishing $27. Hunter education required. Purchase at gfp.sd.gov."
  },
  "Tennessee": {
    hunting: "Whitetail Deer: archery Sep 28–Jan 31, gun varies by zone Nov–Jan. Turkey: spring Apr 5–May 17, fall Oct 3–Nov 3. Bear: archery only in some zones. Dove: Sep 1–Oct 26.",
    fishing: "Brown/Rainbow Trout: Cumberland River tailwater world-class. Largemouth Bass: 15-inch minimum on some TVA lakes. Walleye: 15-inch minimum. Catfish: excellent year-round.",
    general: "Resident licenses: Hunting $34, Fishing $34, Combo $49. Hunter education required for hunters born after 1969. Purchase at tn.gov/twra."
  },
  "Texas": {
    hunting: "Whitetail Deer: archery Oct 1–Nov 1, general Nov 2–Jan 19. Turkey: spring Mar 22–May 12, fall varies by county. Dove: Sep 1–Oct 27 North Zone. Hog: year-round on private land. Regulations vary significantly by county.",
    fishing: "Largemouth Bass: 14-inch minimum most waters, some lakes have slot limits. Redfish: 20–28 inch slot, 3/day. Striped Bass: stocked in some impoundments. Catfish: excellent year-round. Flounder: 12-inch minimum.",
    general: "Resident licenses: Hunting $25, Freshwater Fishing $30, Saltwater $35, Combo $68. Hunter education required. Purchase at tpwd.texas.gov."
  },
  "Utah": {
    hunting: "Mule Deer: archery Aug 17–Sep 14, rifle Oct 18–Nov 2 varies by unit. Elk: archery Aug 17–Sep 14, rifle Oct 18–Nov 2 varies by unit. Antelope: draw tags Aug–Sep. Most units require draw tags.",
    fishing: "Trout: open year-round most waters. Green River: world-class tailwater. Flaming Gorge: kokanee and lake trout. Bass: 12-inch minimum.",
    general: "Resident licenses: Hunting $28, Fishing $34, Combo $55. Hunter education required. Apply for draw tags at wildlife.utah.gov by June 2."
  },
  "Vermont": {
    hunting: "Whitetail Deer: archery Oct 1–Nov 7 and Dec 2–10, rifle Nov 8–Dec 1. Turkey: spring May 1–Jun 8, fall Oct 8–Nov 7. Bear: Sep 1–Nov 30. Moose: draw only Oct.",
    fishing: "Brook Trout: excellent in small streams, 6-inch minimum. Lake Champlain: walleye, bass, pike world-class. Landlocked Salmon: 15-inch minimum. Ice fishing popular Jan–Feb.",
    general: "Resident licenses: Hunting $28, Fishing $28, Combo $43. Hunter education required for hunters born after 1975. Purchase at vtfishandwildlife.com."
  },
  "Virginia": {
    hunting: "Whitetail Deer: archery Sep 7–Jan 4 varies by county, firearm Nov 15–Jan 4 varies. Turkey: spring Apr 4–May 18, fall Oct 5–Nov 22. Bear: Nov 14–Dec 7 in some zones. Dove: Sep 1–Oct 25.",
    fishing: "Trout: stocked Mar–May. Striped Bass: 20-inch minimum tidal, 18-inch minimum non-tidal. Smallmouth Bass: excellent in many rivers. Walleye: 18-inch minimum on New River.",
    general: "Resident licenses: Hunting $23, Fishing $23, Combo $35. Hunter education required for hunters born after 1977. Purchase at dwr.virginia.gov."
  },
  "Washington": {
    hunting: "Blacktail/Mule Deer: archery Sep 1–Oct 19, modern firearm Oct 11–Nov 30 varies by unit. Elk: archery Sep 1–Oct 19, rifle Oct 11–Nov 30 varies by unit. Many units require draw. Bear: Apr 1–May 31 and Aug 1–Nov 15.",
    fishing: "Chinook Salmon: varies by river, Columbia and Puget Sound excellent. Steelhead: year-round on many rivers. Halibut: federal permit, May–Sep. Dungeness Crab: year-round some areas.",
    general: "Resident licenses: Hunting $32, Fishing $30, Combo $54. Hunter education required. Apply for draw tags at wdfw.wa.gov by June. Punch cards required for salmon and steelhead."
  },
  "West Virginia": {
    hunting: "Whitetail Deer: archery Oct 1–Dec 31, firearm Nov 21–Dec 7. Turkey: spring Apr 21–May 13, fall Oct 17–Nov 4. Bear: Oct 28–Dec 31 varies by zone. Grouse: Oct 1–Feb 28.",
    fishing: "Trout: stocked Mar–May. New River: excellent smallmouth bass. Cheat River: great trout and bass. Walleye: 15-inch minimum. Catfish: year-round.",
    general: "Resident licenses: Hunting $19, Fishing $19, Combo $32. Hunter education required for hunters born after 1975. Purchase at wvdnr.gov."
  },
  "Wisconsin": {
    hunting: "Whitetail Deer: archery Sep 14–Jan 6, gun Nov 23–Dec 1. Turkey: spring Apr 16–May 31, fall Sep 14–Nov 7. Bear: Sep 3–Oct 8 draw tags. Pheasant: Oct 19–Jan 5 stocked areas.",
    fishing: "Walleye: 15-inch minimum statewide, 5/day. Muskie: 40-inch minimum. Northern Pike: 24-inch minimum. Sturgeon: spearing season on Lake Winnebago famous.",
    general: "Resident licenses: Deer $24, Small Game $20, Fishing $20, Patron (all) $140. Hunter education required. Purchase at dnr.wisconsin.gov."
  },
  "Wyoming": {
    hunting: "Mule Deer: archery Sep 1–Sep 30, rifle Oct 1–Nov 9 varies by unit. Elk: archery Sep 1–Sep 30, rifle Oct 1–Nov 9 varies by unit. Antelope: archery Aug 15–Sep 30, rifle Sep 15–Oct 5. Many units draw. Some OTC elk available.",
    fishing: "Trout: open year-round most waters. North Platte: blue ribbon brown trout. Snake River: cutthroat excellent. Some Gold Medal waters catch-and-release only. Walleye: excellent in Bighorn Lake.",
    general: "Resident licenses: Deer $46, Elk $57, Fishing $27, Antelope $46. Hunter education required. Apply for draw tags at wgfd.wyo.gov by May 31."
  },
};

function RegulationsTab({ selectedState }) {
  if (!selectedState) return (
    <div className="card" style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Select Your State</div>
      <div style={{ color: "var(--text2)", fontSize: 14 }}>Go back home and choose your state to view regulations.</div>
    </div>
  );

  const regs = STATE_REGULATIONS[selectedState];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card" style={{ padding: "16px 20px" }}>
        <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>REGULATIONS OVERVIEW</div>
        <div style={{ color: "var(--text)", fontWeight: 600, fontSize: 16 }}>{selectedState}</div>
      </div>

      {regs ? (
        <>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>🎯</span>
              <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>Hunting</span>
            </div>
            <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.8 }}>{regs.hunting}</p>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>🎣</span>
              <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>Fishing</span>
            </div>
            <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.8 }}>{regs.fishing}</p>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>📋</span>
              <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 15 }}>Licenses & General Info</span>
            </div>
            <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.8 }}>{regs.general}</p>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--text3)" }}>No regulations data available for this state.</div>
      )}

      <div style={{ padding: "16px 20px", background: "var(--amber-dim)", border: "1px solid rgba(212,147,10,0.2)", borderRadius: "var(--radius)" }}>
        <p style={{ color: "rgba(212,147,10,0.9)", fontSize: 13, lineHeight: 1.7 }}>⚠️ <strong>Important:</strong> Regulations change annually. Always verify with your state's official wildlife agency before hunting or fishing.</p>
      </div>
      <div style={{ padding: "16px 20px", background: "var(--green-dim)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)" }}>
        <p style={{ color: "var(--green)", fontSize: 13, lineHeight: 1.7 }}>💬 Have a specific regulation question? Ask the AI in the Chat tab for more detailed info.</p>
      </div>
    </div>
  );
}

// ─── TERMS PAGE ───────────────────────────────────────────────────────────────
function TermsPage({ onBack }) {
  const sections = [
    ["1. Acceptance of Terms", "By accessing or using WildAI, you agree to be bound by these Terms and Conditions. WildAI reserves the right to update these terms at any time, and continued use constitutes acceptance of any changes."],
    ["2. Nature of Service", "WildAI is an AI-powered informational assistant for hunters and anglers. It is not a licensed guide, outfitter, or wildlife agency. All information is for general educational purposes only."],
    ["3. Regulatory Disclaimer", "Hunting and fishing regulations change frequently. WildAI makes no guarantee that information on seasons, bag limits, or license requirements is current. You are solely responsible for verifying regulations with your state wildlife agency."],
    ["4. Accuracy of Information", "WildAI strives to provide accurate information but may make errors or provide outdated advice. Always apply your own judgment and consult licensed professionals for decisions involving safety or legality."],
    ["5. Safety and Personal Responsibility", "Hunting and fishing involve inherent risks. WildAI accepts no liability for any injury, death, or loss resulting from acting on information provided. Users engage in all outdoor activities at their own risk."],
    ["6. Free Tier and Paid Services", "WildAI offers limited free messages per session. Additional use may require a paid subscription. WildAI reserves the right to modify or discontinue any tier of service with reasonable notice."],
    ["7. User Conduct", "You agree not to use WildAI to facilitate illegal hunting or fishing, poaching, or violations of wildlife protection laws. WildAI may terminate access for users who violate these terms."],
    ["8. Intellectual Property", "All content, design, and functionality of WildAI is protected by applicable intellectual property laws. Reproduction without express written permission is prohibited."],
    ["9. Limitation of Liability", "To the fullest extent permitted by law, WildAI and its affiliates shall not be liable for any direct, indirect, or consequential damages arising from use of the service."],
    ["10. Contact", "Questions about these Terms may be directed to WildAI through the website. We respond to reasonable inquiries in a timely manner."],
  ];
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      <nav style={{ padding: "20px 32px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid var(--border)" }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding: "8px 16px", fontSize: 13 }}>← Back</button>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text)" }}>WildAI · Terms & Conditions</span>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>Terms & Conditions</h1>
        <p style={{ color: "var(--text3)", fontSize: 13, marginBottom: 40 }}>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        {sections.map(([title, body], i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>{title}</h2>
            <p style={{ color: "var(--text2)", fontSize: 15, lineHeight: 1.8 }}>{body}</p>
          </div>
        ))}
        <div style={{ marginTop: 40, padding: "20px 24px", background: "var(--green-dim)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)" }}>
          <p style={{ color: "var(--green)", fontSize: 14, lineHeight: 1.7 }}>🦌 Always check your state's current hunting and fishing regulations before heading out. Your state wildlife agency is the definitive source.</p>
        </div>
        <button onClick={onBack} className="btn-primary" style={{ marginTop: 36, padding: "14px 32px", fontSize: 15 }}>← Back to WildAI</button>
      </div>
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onStart, selectedState, setSelectedState, onTerms }) {
  const tip = DAILY_TIPS[new Date().getDay() % DAILY_TIPS.length];
  const features = [
    { icon: "🎯", title: "Hunting Tactics", desc: "Species-specific strategies, scouting tips, rut timing" },
    { icon: "🎣", title: "Fishing Intel", desc: "Seasonal patterns, lure selection, hotspot guidance" },
    { icon: "🗺️", title: "Interactive Map", desc: "Real public land & fishing access map with pins" },
    { icon: "📋", title: "Live Regulations", desc: "AI-generated state-specific rules & season dates" },
    { icon: "🌤️", title: "Live Weather", desc: "Real conditions with hunting/fishing impact ratings" },
    { icon: "🎒", title: "Gear Checklists", desc: "Interactive pack lists — tap to check items off" },
  ];
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: "var(--font-body)", position: "relative", overflow: "hidden" }}>
      {/* Decorative background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/bg.jpg')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.35, zIndex: 1 }} />
      </div>

      {/* Nav */}
      <nav style={{ padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50, background: "rgba(8,15,8,0.45)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" style={{ width: 32, height: 32, objectFit: "contain", mixBlendMode: "screen" }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px" }}>WildAI</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={onTerms} className="btn-ghost" style={{ padding: "8px 16px", fontSize: 13 }}>Terms</button>
          <button onClick={onStart} className="btn-primary" style={{ padding: "9px 22px", fontSize: 14 }}>Launch App →</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 24px 110px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div className="slide-up" style={{ animationDelay: "0.05s" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--green-dim)", border: "1px solid var(--border-accent)", borderRadius: 30, padding: "6px 16px", marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} className="pulse" />
            <span style={{ color: "var(--green)", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>POWERED BY AI · FREE TO TRY</span>
          </div>
        </div>
        <div className="slide-up" style={{ animationDelay: "0.1s" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px,8vw,86px)", fontWeight: 900, lineHeight: 1.0, color: "var(--text)", letterSpacing: "-3px", marginBottom: 24, maxWidth: 820 }}>
            Your Expert<br />
            <span style={{ color: "var(--green)" }}>Hunting & Fishing</span><br />
            Assistant
          </h1>
        </div>
        <div className="slide-up" style={{ animationDelay: "0.15s" }}>
          <p style={{ color: "var(--text2)", fontSize: 18, maxWidth: 500, lineHeight: 1.7, marginBottom: 40 }}>Instant answers on gear, tactics, regulations, and trip planning — like having a seasoned guide in your pocket.</p>
        </div>
        <div className="slide-up card" style={{ animationDelay: "0.2s", maxWidth: 540, width: "100%", padding: "18px 24px", marginBottom: 36, textAlign: "left", borderColor: "var(--border-accent)" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <div>
              <div style={{ color: "var(--green)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>TIP OF THE DAY</div>
              <div style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.65 }}>{tip}</div>
            </div>
          </div>
        </div>
        <div className="slide-up" style={{ animationDelay: "0.25s", width: "100%", maxWidth: 420, marginBottom: 20 }}>
          <label style={{ color: "var(--text3)", fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", display: "block", marginBottom: 8, textAlign: "left" }}>YOUR STATE (for accurate regulations)</label>
          <select value={selectedState} onChange={e => setSelectedState(e.target.value)} style={{ width: "100%", padding: "14px 18px", borderRadius: "var(--radius-sm)", fontSize: 15, marginBottom: 14 }}>
            <option value="">Select your state...</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={onStart} className="btn-primary" style={{ width: "100%", padding: 16, fontSize: 16, borderRadius: "var(--radius)" }}>Start Asking WildAI →</button>
          <p style={{ color: "var(--text3)", fontSize: 12, marginTop: 10, textAlign: "center" }}>No account needed · 5 free messages</p>
        </div>
        <div className="slide-up" style={{ animationDelay: "0.3s", width: "100%", maxWidth: 760, marginTop: 60 }}>
          <div style={{ color: "var(--text3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 20 }}>EVERYTHING YOU NEED IN THE FIELD</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
            {features.map((f, i) => (
              <div key={i} className="card" style={{ padding: 20, textAlign: "left" }}>
                <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ color: "var(--text)", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
                <div style={{ color: "var(--text3)", fontSize: 12, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "18px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" style={{ width: 20, height: 20, objectFit: "contain", mixBlendMode: "screen" }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--text2)" }}>WildAI</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <button onClick={onTerms} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}>Terms & Conditions</button>
          <span style={{ color: "var(--text3)", fontSize: 12 }}>Always verify regulations with your state agency</span>
        </div>
      </footer>
    </div>
  );
}

// ─── CHAT PAGE ────────────────────────────────────────────────────────────────
function ChatPage({ onBack, messageCount, setMessageCount, selectedState, onTerms }) {
  const [tab, setTab] = useState("chat");
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hey, I'm WildAI — your hunting and fishing assistant${selectedState ? ` for ${selectedState}` : ""}. Ask me anything about gear, tactics, seasons, regulations, or trip planning. What are you after?`, animate: false },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [showMore, setShowMore] = useState(false);
  const [stateSpecies, setStateSpecies] = useState([]);
  const [loadingStateSpecies, setLoadingStateSpecies] = useState(false);
  const speciesTabCache = useRef({});
  const bottomRef = useRef(null);
  const { user, isLoaded } = useUser();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { openSignIn } = useClerk();
  const isPro = user?.publicMetadata?.isPro === true;
  const hitLimit = !isPro && messageCount >= FREE_LIMIT;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim() || hitLimit) return;
    const newMsgs = [...messages, { role: "user", content: msg, animate: false }];
    setMessages(newMsgs); setInput(""); setLoading(true);
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    localStorage.setItem("wildai_message_count", newCount);
    if (tab !== "chat") setTab("chat");
    const now = new Date();
    const moonPhase = () => {
      const synodicMonth = 29.53058867;
      const known = new Date(2000, 0, 6, 18, 14, 0);
      const diff = (now - known) / (1000 * 60 * 60 * 24);
      const phase = ((diff % synodicMonth) + synodicMonth) % synodicMonth;
      if (phase < 1.85) return "New Moon 🌑";
      if (phase < 5.53) return "Waxing Crescent 🌒";
      if (phase < 9.22) return "First Quarter 🌓";
      if (phase < 12.91) return "Waxing Gibbous 🌔";
      if (phase < 16.61) return "Full Moon 🌕";
      if (phase < 20.30) return "Waning Gibbous 🌖";
      if (phase < 23.99) return "Last Quarter 🌗";
      if (phase < 27.68) return "Waning Crescent 🌘";
      return "New Moon 🌑";
    };
    const timeOfDay = now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening";
    const system = `You are WildAI, an expert hunting and fishing assistant${selectedState ? ` specializing in ${selectedState}` : ""}. Deep knowledge of hunting tactics, fishing techniques, gear, wildlife behavior, seasons, regulations${selectedState ? ` specific to ${selectedState}` : " across US states"}, trip planning, and public land navigation. Give practical, specific, confident advice like a seasoned outdoorsman. Use **bold** for key terms. Keep responses concise and useful. Remind users to verify regulations with their state agency when relevant.If a user asks about canceling their subscription or managing billing, tell them to click their profile avatar in the top right corner of the app and select "Manage Subscription".

CURRENT CONTEXT (use this for accurate seasonal and timing advice):
- Today's date: ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
- Time of day: ${timeOfDay}
- Current moon phase: ${moonPhase()}
- User's state: ${selectedState || "not specified"}
- Season: ${["Winter", "Winter", "Spring", "Spring", "Spring", "Summer", "Summer", "Summer", "Fall", "Fall", "Fall", "Winter"][now.getMonth()]}${weather && locationName ? `\n- Current weather at ${locationName}: ${Math.round(weather.temperature_2m)}°F, wind ${Math.round(weather.wind_speed_10m)}mph, precip ${weather.precipitation}"` : `\n- Current weather: not loaded. If the user asks about current conditions, tell them to enter a location in the Weather tab and then come back to chat.`}`;
    try {
      const res = await fetch("https://wildai-server.onrender.com/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs.map(m => ({ role: m.role, content: m.content })), system })
      });
      const d = await res.json();
      setMessages([...newMsgs, { role: "assistant", content: d.reply, animate: true }]);
    } catch {
      setMessages([...newMsgs, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again.", animate: false }]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedState) return;
    const cacheKey = selectedState;
    if (speciesTabCache.current[cacheKey]) {
      setStateSpecies(speciesTabCache.current[cacheKey]);
      return;
    }
    setLoadingStateSpecies(true);
    const prompt = `Return ONLY a JSON array of objects for the 30 most commonly hunted and fished species in ${selectedState}. Each object must have: name (string), type ("hunting" or "fishing"), desc (string, max 5 words). No markdown, no explanation, just the JSON array.`;
    fetch("https://wildai-server.onrender.com/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }], system: "Return only a valid JSON array. No markdown. No explanation." })
    })
      .then(r => r.json())
      .then(d => {
        const text = d.reply.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(text);
        setStateSpecies(parsed);
        speciesTabCache.current[cacheKey] = parsed;
      })
      .catch(() => setStateSpecies([]))
      .finally(() => setLoadingStateSpecies(false));
  }, [selectedState]);
  const toggleCheck = (cl, item) => {
    const k = `${cl}::${item}`;
    setCheckedItems(p => ({ ...p, [k]: !p[k] }));
  };


  const filteredSpecies = speciesFilter === "all" ? SPECIES : SPECIES.filter(s => s.type === speciesFilter);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: "var(--font-body)" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      </div>

      <header style={{ borderBottom: "1px solid var(--border)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(12px)", background: "rgba(8,15,8,0.92)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onBack} className="btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }}>← Home</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/logo.png" style={{ width: 28, height: 28, objectFit: "contain", mixBlendMode: "screen" }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text)" }}>WildAI</span>
            {selectedState && <span style={{ color: "var(--text3)", fontSize: 13 }}>· {selectedState}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: hitLimit ? "rgba(255,100,100,0.1)" : "var(--green-dim)", border: `1px solid ${hitLimit ? "rgba(255,100,100,0.2)" : "var(--border-accent)"}`, color: hitLimit ? "#ff6b6b" : "var(--green)" }}>
            {hitLimit ? "Limit reached" : isPro ? "Pro ✓" : `${Math.max(0, FREE_LIMIT - messageCount)} msgs left`}
          </div>
          {!user ? (
            <button onClick={() => openSignIn()} className="btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }}>Sign In</button>
          ) : (
            <UserButton afterSignOutUrl="https://wildai.netlify.app">
              <UserButton.MenuItems>
                <UserButton.Action
                  label="Manage Subscription"
                  labelIcon={<span>💳</span>}
                  onClick={async () => {
                    const customerId = user?.publicMetadata?.stripeCustomerId;
                    const res = await fetch("https://wildai-server.onrender.com/customer-portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId }) });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                />
              </UserButton.MenuItems>
            </UserButton>
          )}
        </div>
      </header>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, background: "rgba(8,15,8,0.97)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "stretch", height: 64, backdropFilter: "blur(12px)" }}>
        {[
          { id: "chat", icon: "💬", label: "Chat" },
          { id: "map", icon: "🗺️", label: "Map" },
          { id: "weather", icon: "🌤️", label: "Weather" },
          { id: "more", icon: "☰", label: "More" },
        ].map(t => (
          <button key={t.id} onClick={() => { if (t.id === "more") { setShowMore(s => !s); } else { setTab(t.id); setShowMore(false); } }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: tab === t.id && t.id !== "more" ? "var(--green)" : showMore && t.id === "more" ? "var(--green)" : "var(--text3)", transition: "color 0.2s" }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.04em" }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* MORE DRAWER */}
      {showMore && (
        <div style={{ position: "fixed", bottom: 64, left: 0, right: 0, zIndex: 99, background: "rgba(8,15,8,0.98)", borderTop: "1px solid var(--border)", padding: "16px 20px", backdropFilter: "blur(12px)" }} onClick={() => setShowMore(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 760, margin: "0 auto" }}>
            {[
              { id: "species", icon: "🎯", label: "Species" },
              { id: "regs", icon: "📋", label: "Regulations" },
              { id: "trip", icon: "🧭", label: "Trip Planner" },
              { id: "gear", icon: "🎒", label: "Gear" },
              { id: "licenses", icon: "🪪", label: "Licenses" },
              { id: "harvest", icon: "📓", label: "Harvest Log" },
              { id: "community", icon: "🌲", label: "Community" },
              { id: "about", icon: "ℹ️", label: "About" },
            ].map(t => (
              <button key={t.id} onClick={(e) => { e.stopPropagation(); setTab(t.id); setShowMore(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: tab === t.id ? "var(--green-dim)" : "rgba(255,255,255,0.03)", border: `1px solid ${tab === t.id ? "var(--border-accent)" : "var(--border)"}`, borderRadius: "var(--radius-sm)", cursor: "pointer", color: tab === t.id ? "var(--green)" : "var(--text2)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500, transition: "all 0.15s" }}>
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, padding: 20, paddingBottom: 80, maxWidth: 760, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, position: "relative", zIndex: 1 }}>

        {/* CHAT */}
        {tab === "chat" && (
          <div className="fade-in card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16, minHeight: 340, maxHeight: 500 }}>
              {messages.map((m, i) => (
                <div key={i} className="fade-in" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 10, alignItems: "flex-end" }}>
                  {m.role === "assistant" && <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,var(--green),var(--green2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0, boxShadow: "0 4px 12px rgba(120,180,80,0.25)" }}>🦌</div>}
                  <div style={{ background: m.role === "user" ? "linear-gradient(135deg,var(--green),var(--green2))" : "rgba(255,255,255,0.05)", border: m.role === "assistant" ? "1px solid var(--border)" : "none", color: "var(--text)", padding: "13px 17px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", maxWidth: "80%", boxShadow: m.role === "user" ? "0 4px 16px rgba(120,180,80,0.2)" : "none" }}>
                    {m.role === "assistant" && m.animate
                      ? <TypewriterText text={m.content} onDone={() => setMessages(prev => prev.map((msg, j) => j === i ? { ...msg, animate: false } : msg))} />
                      : fmtMsg(m.content)}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,var(--green),var(--green2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🦌</div>
                  <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", padding: "13px 17px", borderRadius: "18px 18px 18px 4px" }}>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      {[0, 1, 2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            {messages.length <= 2 && !hitLimit && (
              <div style={{ padding: "0 20px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[`Best ${selectedState || "local"} elk setup?`, "What's biting right now?", "Plan me a 3-day hunt", "Deer scouting tips"].map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} className="btn-ghost" style={{ padding: "7px 14px", fontSize: 12, borderRadius: 20 }}>{s}</button>
                ))}
              </div>
            )}
            {hitLimit && (
              <div style={{ margin: "0 20px 20px", background: "linear-gradient(135deg,rgba(120,180,80,0.08),rgba(90,154,50,0.04))", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)", padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--text)", marginBottom: 6 }}>Upgrade to WildAI Pro</div>
                <div style={{ color: "var(--text2)", fontSize: 14, marginBottom: 18, lineHeight: 1.6 }}>You've used your free messages. Get unlimited access and advanced features.</div>
                <button className="btn-primary" style={{ padding: "13px 32px", fontSize: 15, borderRadius: "var(--radius)", opacity: checkoutLoading ? 0.6 : 1 }} disabled={checkoutLoading} onClick={async () => { if (!user) { openSignIn(); return; } setCheckoutLoading(true); const res = await fetch("https://wildai-server.onrender.com/create-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.id }) }); const data = await res.json(); if (data.url) window.location.href = data.url; setCheckoutLoading(false); }}>
                  {checkoutLoading ? "Loading..." : "Upgrade for $4.99/month →"}
                </button>
              </div>
            )}
            {!hitLimit && (
              <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "center" }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder={`Ask anything about hunting & fishing${selectedState ? ` in ${selectedState}` : ""}...`}
                  style={{ flex: 1, padding: "13px 18px", borderRadius: "var(--radius-sm)", fontSize: 14 }} />
                <button onClick={() => sendMessage()} className="btn-primary" style={{ padding: "13px 22px", fontSize: 14, borderRadius: "var(--radius-sm)", flexShrink: 0 }}>Send →</button>
              </div>
            )}
          </div>
        )}

        {tab === "weather" && (
          <div className="fade-in">
            <WeatherWidget selectedState={selectedState} weather={weather} setWeather={setWeather} locationName={locationName} setLocationName={setLocationName} />
            <div style={{ marginTop: 14, padding: "16px 20px", background: "var(--green-dim)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--text2)", lineHeight: 1.65 }}>
              🎯 <strong style={{ color: "var(--green)" }}>Pro tip:</strong> Best hunting follows a cold front — pressure rising, temps dropping, light winds. Fish activity peaks when pressure is stable or rising.
            </div>
          </div>
        )}

        {tab === "map" && <MapTab selectedState={selectedState} user={user} onSharePin={(pin) => { window._sharePinToComm = pin; setTab("community"); }} />}

        {tab === "regs" && <RegulationsTab selectedState={selectedState} />}
        {tab === "licenses" && <LicensesTab selectedState={selectedState} />}
        {tab === "trip" && <TripPlannerTab selectedState={selectedState} isPro={isPro} hitLimit={hitLimit} messageCount={messageCount} setMessageCount={setMessageCount} onUpgrade={async () => { if (!user) { openSignIn(); return; } setCheckoutLoading(true); const res = await fetch("https://wildai-server.onrender.com/create-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.id }) }); const data = await res.json(); if (data.url) window.location.href = data.url; setCheckoutLoading(false); }} />}
        {tab === "species" && (
          <div className="fade-in">
            {!selectedState ? (
              <div className="card" style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
                <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Select Your State</div>
                <div style={{ color: "var(--text2)", fontSize: 14 }}>Go back home and choose your state to see available species.</div>
              </div>
            ) : (
              <>
                <div style={{ color: "var(--text3)", fontSize: 12, marginBottom: 12 }}>Don't see your species? Ask the AI in the Chat tab →</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {["all", "hunting", "fishing"].map(f => (
                    <button key={f} onClick={() => setSpeciesFilter(f)} className={`nav-tab ${speciesFilter === f ? "active" : "inactive"}`} style={{ padding: "7px 18px", fontSize: 12 }}>
                      {f === "all" ? "All" : f === "hunting" ? "🎯 Hunting" : "🎣 Fishing"}
                    </button>
                  ))}
                </div>
                {loadingStateSpecies && (
                  <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14 }} className="pulse">Loading {selectedState} species...</div>
                )}
                {!loadingStateSpecies && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
                    {(stateSpecies.length > 0 ? stateSpecies : SPECIES)
                      .filter(s => speciesFilter === "all" || s.type === speciesFilter)
                      .map(s => (
                        <button key={s.name} onClick={() => { sendMessage(`Give me a complete guide for ${s.name} — best tactics, gear, timing, and ${selectedState ? selectedState + " specific " : ""}tips.`); setTab("chat"); }} className="card" style={{ padding: "20px 16px", textAlign: "center", cursor: "pointer", border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 32, marginBottom: 10 }}>{SPECIES_ICONS[s.name] || (s.type === "hunting" ? "🎯" : "🎣")}</div>
                          <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.name}</div>
                          <div style={{ color: "var(--text3)", fontSize: 11, marginBottom: 10 }}>{s.desc}</div>
                          <span className={`tag tag-${s.type === "hunting" ? "hunt" : "fish"}`}>{s.type}</span>
                        </button>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "gear" && (
          <div className="fade-in">
            {!selectedChecklist ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
                {Object.entries(GEAR_CHECKLISTS).map(([k, v]) => (
                  <button key={k} onClick={() => setSelectedChecklist(k)} className="card" style={{ padding: "22px 16px", textAlign: "center", cursor: "pointer", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>{v.icon}</div>
                    <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{k}</div>
                    <div style={{ color: "var(--text3)", fontSize: 12 }}>{v.items.length} items</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="fade-in">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{GEAR_CHECKLISTS[selectedChecklist].icon}</span>
                    <h3 style={{ color: "var(--text)", fontSize: 18, fontFamily: "var(--font-display)" }}>{selectedChecklist}</h3>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setCheckedItems({})} className="btn-ghost" style={{ padding: "7px 14px", fontSize: 12 }}>Reset</button>
                    <button onClick={() => setSelectedChecklist(null)} className="btn-ghost" style={{ padding: "7px 14px", fontSize: 12 }}>← Back</button>
                  </div>
                </div>
                <div style={{ color: "var(--text3)", fontSize: 12, marginBottom: 14 }}>{Object.values(checkedItems).filter(Boolean).length} / {GEAR_CHECKLISTS[selectedChecklist].items.length} packed</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {GEAR_CHECKLISTS[selectedChecklist].items.map((item, i) => {
                    const k = `${selectedChecklist}::${item}`; const checked = checkedItems[k];
                    return (
                      <div key={i} onClick={() => toggleCheck(selectedChecklist, item)} className={`checklist-item ${checked ? "checked" : ""}`}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? "var(--green)" : "rgba(255,255,255,0.15)"}`, background: checked ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                          {checked && <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>}
                        </div>
                        {item}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        {tab === "harvest" && <HarvestLogTab user={user} openSignIn={openSignIn} />}
        {tab === "community" && <CommunityTab selectedState={selectedState} user={user} openSignIn={openSignIn} />}
        {tab === "about" && (
          <div className="fade-in card" style={{ padding: 32 }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }} className="float">🦌</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text)", marginBottom: 8 }}>WildAI</h2>
              <p style={{ color: "var(--green)", fontSize: 14, fontWeight: 500 }}>Built for hunters & anglers, by outdoorsmen</p>
            </div>
            <div style={{ color: "var(--text2)", fontSize: 15, lineHeight: 1.85, display: "flex", flexDirection: "column", gap: 16 }}>
              <p>WildAI is an AI-powered hunting and fishing assistant designed to give you the kind of advice you'd get from a seasoned outdoorsman — specific, practical, and straight to the point.</p>
              <p>Whether you're planning your first elk hunt, figuring out what flies are working on your local river, or need to know the regulations for a new state, WildAI has you covered.</p>
              <div style={{ padding: "16px 20px", background: "var(--amber-dim)", border: "1px solid rgba(212,147,10,0.2)", borderRadius: "var(--radius-sm)" }}>
                <p style={{ color: "rgba(212,147,10,0.9)", fontSize: 13, margin: 0 }}>⚠️ Always verify current regulations with your state wildlife agency. Regulations change and WildAI's information may not always be current.</p>
              </div>
            </div>
            <div style={{ marginTop: 28, paddingTop: 28, borderTop: "1px solid var(--border)" }}>
              {isPro && (
                <div style={{ marginTop: 16 }}>
                  <button className="btn-ghost" style={{ padding: "10px 20px", fontSize: 13 }} onClick={async () => {
                    const customerId = user?.publicMetadata?.stripeCustomerId;
                    const res = await fetch("https://wildai-server.onrender.com/customer-portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId }) });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}>Manage Subscription →</button>
                </div>
              )}
              <button onClick={onTerms} className="btn-ghost" style={{ padding: "10px 20px", fontSize: 13 }}>View Terms & Conditions →</button>
            </div>
          </div>
        )}
      </div>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "14px 20px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <span style={{ color: "var(--text3)", fontSize: 11 }}>WildAI · Powered by AI · Always verify regulations with your state agency</span>
      </footer>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [prevPage, setPrevPage] = useState("landing");
  const [messageCount, setMessageCount] = useState(() => {
    const saved = localStorage.getItem("wildai_message_count");
    return saved ? parseInt(saved) : 0;
  });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {

      window.history.replaceState({}, "", "/");
      setPage("chat");
    }
  }, []);
  const [selectedState, setSelectedState] = useState("");
  const goTo = (p) => { setPrevPage(page); setPage(p); };
  return (
    <>
      <style>{css}</style>
      <div className="grain" />
      {page === "terms" && <TermsPage onBack={() => setPage(prevPage === "chat" ? "chat" : "landing")} />}
      {page === "landing" && <LandingPage onStart={() => goTo("chat")} selectedState={selectedState} setSelectedState={setSelectedState} onTerms={() => goTo("terms")} />}
      {page === "chat" && <ChatPage onBack={() => goTo("landing")} messageCount={messageCount} setMessageCount={setMessageCount} selectedState={selectedState} onTerms={() => goTo("terms")} />}
    </>
  );
}
