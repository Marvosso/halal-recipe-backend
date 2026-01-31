/**
 * Enhanced Knowledge Base Generator
 * Creates comprehensive halal_knowledge.json with expanded fields
 * Then generates nested ingredients.json from it
 */

const fs = require('fs');
const path = require('path');

const outputFlatPath = path.join(__dirname, '../src/data/halal_knowledge.json');
const outputNestedPath = path.join(__dirname, '../src/data/ingredients.json');

console.log('Generating enhanced halal knowledge base...');

/**
 * Comprehensive ingredient database with enhanced fields
 * Organized by category for better maintainability
 */
const enhancedIngredients = {
  // ============ PORK & PORK PRODUCTS ============
  pork: {
    name: "pork",
    aliases: ["pork_belly", "pancetta", "pork_fat"],
    halal_alternatives: ["chicken_thigh", "beef_halal_certified"],
    conversion_ratio: "1:1",
    category: "meat",
    status: "haram",
    school_of_thought_variation: {}, // All schools agree
    inheritance: [],
    notes: "Chicken thigh mimics pork fat better than breast",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 0.1,
    eli5: "Pork is from pigs, which are not allowed in Islam."
  },
  
  bacon: {
    name: "bacon",
    aliases: ["smoked_pork", "rashers", "streaky_bacon"],
    halal_alternatives: ["smoked_turkey_bacon", "beef_bacon_halal"],
    conversion_ratio: "1:1",
    category: "meat",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["pork"],
    notes: "Add a dash of oil if turkey is lean",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.1,
    eli5: "Bacon is made from pork, which is forbidden in Islam."
  },
  
  ham: {
    name: "ham",
    aliases: ["cured_pork", "prosciutto", "serrano_ham"],
    halal_alternatives: ["halal_beef_pastrami", "turkey_ham_halal"],
    conversion_ratio: "1:1",
    category: "meat",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["pork"],
    notes: "Beef pastrami preserves cured flavor",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 0.1,
    eli5: "Ham is made from pork, which is forbidden in Islam."
  },
  
  lard: {
    name: "lard",
    aliases: ["pork_fat", "rendered_pork_fat"],
    halal_alternatives: ["beef_tallow_halal", "vegetable_shortening"],
    conversion_ratio: "1:1",
    category: "fat",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["pork"],
    notes: "Neutral replacement for frying",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.1,
    eli5: "Lard is fat from pigs, which is forbidden in Islam."
  },
  
  // ============ GELATIN & GELATIN PRODUCTS ============
  gelatin: {
    name: "gelatin",
    aliases: ["pork_gelatin", "collagen", "gelatine", "animal_gelatin"],
    halal_alternatives: ["agar_agar", "halal_beef_gelatin", "pectin"],
    conversion_ratio: "1:0.5",
    category: "gelatin",
    status: "conditional",
    school_of_thought_variation: {
      hanafi: "haram", // If source unknown
      shafii: "haram", // If source unknown
      maliki: "haram", // If source unknown
      hanbali: "haram" // If source unknown
    },
    inheritance: ["pork"],
    notes: "Agar is stronger than gelatin. Check the source before consuming. Must be halal-certified if animal-derived.",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 0.5,
    eli5: "Gelatin is made from animal parts, so whether it's halal depends on the animal."
  },
  
  marshmallows: {
    name: "marshmallows",
    aliases: ["marshmallow", "mallow_candy", "gelatin_candy"],
    halal_alternatives: ["halal_marshmallows", "vegan_marshmallows", "marshmallows_with_agar"],
    conversion_ratio: "1:1",
    category: "gelatin",
    status: "conditional",
    school_of_thought_variation: {},
    inheritance: ["gelatin"],
    notes: "Marshmallows typically contain gelatin, which may come from pork sources. Must be halal-certified gelatin",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 0.5,
    eli5: "Marshmallows often contain gelatin, which may come from pork."
  },
  
  gummy_candy: {
    name: "gummy_candy",
    aliases: ["gummies", "fruit_snacks", "jelly_candy", "chewy_candy"],
    halal_alternatives: ["halal_gummy_candy", "vegan_gummies", "fruit_leather"],
    conversion_ratio: "1:1",
    category: "gelatin",
    status: "conditional",
    school_of_thought_variation: {},
    inheritance: ["gelatin"],
    notes: "Pork gelatin common. Must be halal-certified gelatin",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 0.5,
    eli5: "Gummy candy often contains gelatin, which may come from pork."
  },
  
  jello: {
    name: "jello",
    aliases: ["jelly", "gelatin_dessert", "fruit_jelly"],
    halal_alternatives: ["agar_agar_jelly", "halal_jello", "fruit_gel"],
    conversion_ratio: "1:0.5",
    category: "gelatin",
    status: "conditional",
    school_of_thought_variation: {},
    inheritance: ["gelatin"],
    notes: "Typically contains pork gelatin. Use agar-agar for halal version",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 0.5,
    eli5: "Jello contains gelatin, which may come from pork."
  },
  
  lucky_charms: {
    name: "lucky_charms",
    aliases: ["lucky_charms_cereal"],
    halal_alternatives: ["halal_certified_cereals", "homemade_cereal", "cereal_without_marshmallows"],
    conversion_ratio: "1:1",
    category: "gelatin",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["marshmallows"],
    notes: "Lucky Charms contain marshmallows that typically use pork-derived gelatin",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "",
    confidence_score_base: 0.5,
    eli5: "Lucky Charms contain marshmallows that usually use pork gelatin."
  },
  
  // ============ ALCOHOL & ALCOHOLIC INGREDIENTS ============
  alcohol: {
    name: "alcohol",
    aliases: ["ethanol", "spirits", "liquor", "intoxicant"],
    halal_alternatives: ["non_alcoholic_substitutes", "vinegar", "broth"],
    conversion_ratio: "1:1",
    category: "alcohol",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: [],
    notes: "Alcohol in any form is prohibited in Islam",
    quranic_reference: "Surah Al-Ma'idah 5:90",
    hadith_reference: "Sahih Bukhari 7:69:494",
    confidence_score_base: 0.1,
    eli5: "Alcohol is forbidden in Islam."
  },
  
  wine: {
    name: "wine",
    aliases: ["red_wine", "white_wine", "cooking_wine", "wine_vinegar"],
    halal_alternatives: ["grape_juice_plus_vinegar", "non_alcoholic_wine"],
    conversion_ratio: "1:0.75",
    category: "alcohol",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["alcohol"],
    notes: "Use 3 parts juice + 1 part vinegar",
    quranic_reference: "Surah Al-Ma'idah 5:90",
    hadith_reference: "Sahih Bukhari 7:69:494",
    confidence_score_base: 0.1,
    eli5: "Wine contains alcohol, which is not allowed in Islam."
  },
  
  beer: {
    name: "beer",
    aliases: ["ale", "lager", "beer_batter"],
    halal_alternatives: ["malt_vinegar_plus_water", "sparkling_water", "non_alcoholic_beer"],
    conversion_ratio: "1:0.5",
    category: "alcohol",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["alcohol"],
    notes: "Reduces bitterness without alcohol",
    quranic_reference: "Surah Al-Ma'idah 5:90",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.1,
    eli5: "Beer contains alcohol, which is forbidden in Islam."
  },
  
  rum: {
    name: "rum",
    aliases: ["dark_rum", "light_rum", "rum_extract", "rum_flavoring"],
    halal_alternatives: ["vanilla_extract_plus_molasses", "alcohol_free_rum_flavor"],
    conversion_ratio: "1:0.75",
    category: "alcohol",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["alcohol"],
    notes: "Mimics depth without alcohol. Even small amounts are impermissible",
    quranic_reference: "Surah Al-Ma'idah 5:90",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.1,
    eli5: "Rum contains alcohol, which is forbidden in Islam."
  },
  
  brandy: {
    name: "brandy",
    aliases: ["cognac", "brandy_flavor", "liqueur"],
    halal_alternatives: ["grape_juice_reduction", "alcohol_free_brandy_flavor"],
    conversion_ratio: "1:0.75",
    category: "alcohol",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["alcohol"],
    notes: "Reduces alcohol while keeping flavor",
    quranic_reference: "Surah Al-Ma'idah 5:90",
    hadith_reference: "Sahih Muslim 10:3883",
    confidence_score_base: 0.1,
    eli5: "Brandy contains alcohol, which is forbidden in Islam."
  },
  
  mirin: {
    name: "mirin",
    aliases: ["sweet_rice_wine", "cooking_sake"],
    halal_alternatives: ["sugar_plus_rice_vinegar", "halal_mirin"],
    conversion_ratio: "1:0.5",
    category: "alcohol",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["alcohol"],
    notes: "1 tsp sugar + 1 tsp vinegar",
    quranic_reference: "Surah Al-Ma'idah 5:90",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.1,
    eli5: "Mirin contains alcohol, which is forbidden in Islam."
  },
  
  vanilla_extract: {
    name: "vanilla_extract",
    aliases: ["vanilla_extract_alcohol", "pure_vanilla_extract", "imitation_vanilla"],
    halal_alternatives: ["alcohol_free_vanilla", "vanilla_powder", "vanilla_bean_paste"],
    conversion_ratio: "1:1",
    category: "flavoring",
    status: "questionable",
    school_of_thought_variation: {
      hanafi: "haram", // If contains alcohol
      shafii: "questionable", // Trace amounts debated
      maliki: "questionable",
      hanbali: "haram"
    },
    inheritance: ["alcohol"],
    notes: "Ensure alcohol-free labeling. Some scholars allow trace amounts, others don't",
    quranic_reference: "Surah Al-Ma'idah 5:90",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.5,
    eli5: "Vanilla extract often has a little bit of alcohol in it, so check if it's alcohol-free."
  },
  
  // ============ MEAT & MEAT PRODUCTS ============
  beef: {
    name: "beef",
    aliases: ["steak", "ground_beef", "beef_meat"],
    halal_alternatives: ["halal_certified_beef"],
    conversion_ratio: "1:1",
    category: "meat",
    status: "questionable",
    school_of_thought_variation: {},
    inheritance: [],
    notes: "Must be halal-certified (halal slaughter)",
    quranic_reference: "Surah Al-Baqarah 2:172",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 1.0,
    eli5: "Beef is halal if the animal was prepared in the Islamic way."
  },
  
  chicken: {
    name: "chicken",
    aliases: ["chicken_meat", "poultry"],
    halal_alternatives: ["halal_certified_chicken"],
    conversion_ratio: "1:1",
    category: "meat",
    status: "questionable",
    school_of_thought_variation: {},
    inheritance: [],
    notes: "Must be halal-certified (halal slaughter)",
    quranic_reference: "Surah Al-Baqarah 2:172",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 1.0,
    eli5: "Chicken is halal if the animal was prepared in the Islamic way."
  },
  
  lamb: {
    name: "lamb",
    aliases: ["mutton", "lamb_meat"],
    halal_alternatives: ["halal_certified_lamb"],
    conversion_ratio: "1:1",
    category: "meat",
    status: "questionable",
    school_of_thought_variation: {},
    inheritance: [],
    notes: "Must be halal-certified (halal slaughter)",
    quranic_reference: "Surah Al-Baqarah 2:172",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 1.0,
    eli5: "Lamb is halal if the animal was prepared in the Islamic way."
  },
  
  pepperoni: {
    name: "pepperoni",
    aliases: ["pepperoni_slices", "pepperoni_sticks"],
    halal_alternatives: ["halal_beef_pepperoni", "turkey_pepperoni_halal"],
    conversion_ratio: "1:1",
    category: "meat",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["pork"],
    notes: "Typically pork-based. Halal beef preserves spice and chew",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Muslim 13:3808",
    confidence_score_base: 0.1,
    eli5: "Pepperoni is usually made from pork, which is forbidden."
  },
  
  salami: {
    name: "salami",
    aliases: ["dry_salami", "pork_salami"],
    halal_alternatives: ["halal_beef_salami", "turkey_salami_halal"],
    conversion_ratio: "1:1",
    category: "meat",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["pork"],
    notes: "Pork is default meat. Must be halal-certified",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 0.1,
    eli5: "Salami is usually made from pork, which is forbidden."
  },
  
  hot_dogs: {
    name: "hot_dogs",
    aliases: ["frankfurters", "wieners", "frankfurters"],
    halal_alternatives: ["halal_beef_hot_dogs", "chicken_hot_dogs_halal"],
    conversion_ratio: "1:1",
    category: "meat",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["pork"],
    notes: "Often pork or mixed meat. Must be halal-certified",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Muslim 13:3808",
    confidence_score_base: 0.1,
    eli5: "Hot dogs often contain pork, which is forbidden."
  },
  
  sausage: {
    name: "sausage",
    aliases: ["pork_sausage", "breakfast_sausage", "italian_sausage"],
    halal_alternatives: ["chicken_sausage", "turkey_sausage_halal", "beef_sausage_halal"],
    conversion_ratio: "1:1",
    category: "meat",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["pork"],
    notes: "Choose seasoned chicken sausage to match flavor profile",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.1,
    eli5: "Many sausages contain pork, which is forbidden."
  },
  
  // ============ CHEESE & DAIRY ============
  rennet_cheese: {
    name: "rennet_cheese",
    aliases: ["animal_rennet_cheese", "traditional_cheese", "aged_cheese"],
    halal_alternatives: ["microbial_rennet_cheese", "vegetarian_cheese", "halal_certified_cheese"],
    conversion_ratio: "1:1",
    category: "additive",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: [],
    notes: "Most rennet comes from non-halal calves. Microbial rennet is halal-safe",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 0.1,
    eli5: "Some cheese is made with enzymes from animals that weren't slaughtered halal."
  },
  
  animal_rennet: {
    name: "animal_rennet",
    aliases: ["rennet", "cheese_enzyme", "chymosin"],
    halal_alternatives: ["microbial_rennet", "vegetarian_rennet"],
    conversion_ratio: "1:1",
    category: "additive",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: [],
    notes: "Common in cheese production. Check for microbial/vegetarian sources",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 0.1,
    eli5: "Animal rennet comes from the stomach of calves that may not be halal."
  },
  
  // ============ ADDITIVES & EMULSIFIERS ============
  mono_diglycerides: {
    name: "mono_diglycerides",
    aliases: ["e471", "emulsifier", "glycerides"],
    halal_alternatives: ["plant_based_emulsifier", "lecithin"],
    conversion_ratio: "1:1",
    category: "additive",
    status: "questionable",
    school_of_thought_variation: {},
    inheritance: [],
    notes: "Source-dependent ingredient. May be animal-derived unless specified plant-based",
    quranic_reference: "Surah Al-Baqarah 2:172",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.5,
    eli5: "This ingredient can come from animal or plant sources, so check the label."
  },
  
  l_cysteine: {
    name: "l_cysteine",
    aliases: ["e920", "dough_conditioner", "cysteine"],
    halal_alternatives: ["plant_based_l_cysteine", "synthetic_l_cysteine"],
    conversion_ratio: "1:1",
    category: "additive",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: [],
    notes: "Often derived from human hair or feathers. Must be plant-based or synthetic",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.1,
    eli5: "This ingredient often comes from human hair, which is not halal."
  },
  
  carmine: {
    name: "carmine",
    aliases: ["e120", "cochineal", "carmine_red", "natural_red_4"],
    halal_alternatives: ["beetroot_color", "paprika_extract", "red_cabbage_extract"],
    conversion_ratio: "1:1",
    category: "additive",
    status: "questionable",
    school_of_thought_variation: {
      hanafi: "haram", // Insects generally haram
      shafii: "questionable",
      maliki: "questionable",
      hanbali: "haram"
    },
    inheritance: [],
    notes: "Derived from insects (cochineal). Some schools allow, others don't",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 0.5,
    eli5: "This red color comes from insects, which some Muslims avoid."
  },
  
  shellac: {
    name: "shellac",
    aliases: ["e904", "confectioners_glaze", "food_glaze", "lac_resin"],
    halal_alternatives: ["plant_based_glaze", "carnauba_wax"],
    conversion_ratio: "1:1",
    category: "additive",
    status: "questionable",
    school_of_thought_variation: {
      hanafi: "haram",
      shafii: "questionable",
      maliki: "questionable",
      hanbali: "haram"
    },
    inheritance: [],
    notes: "Derived from insects. Used as shiny coating on candies",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 0.5,
    eli5: "This shiny coating comes from insects, which some Muslims avoid."
  },
  
  pepsin: {
    name: "pepsin",
    aliases: ["digestive_enzyme", "pepsin_enzyme"],
    halal_alternatives: ["plant_based_enzymes", "microbial_enzymes"],
    conversion_ratio: "1:1",
    category: "additive",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: [],
    notes: "Derived from pig stomach lining. Must use plant-based alternatives",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 0.1,
    eli5: "Pepsin comes from pig stomachs, which is forbidden."
  },
  
  animal_shortening: {
    name: "animal_shortening",
    aliases: ["shortening", "tallow_shortening", "animal_fat_shortening"],
    halal_alternatives: ["vegetable_shortening", "halal_certified_shortening"],
    conversion_ratio: "1:1",
    category: "fat",
    status: "questionable",
    school_of_thought_variation: {},
    inheritance: [],
    notes: "May contain pork fat. Check label for animal fats",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 0.5,
    eli5: "This shortening might contain pork fat, so check the label."
  },
  
  // ============ SAUCES & CONDIMENTS ============
  worcestershire_sauce: {
    name: "worcestershire_sauce",
    aliases: ["worcestershire", "anchovy_sauce"],
    halal_alternatives: ["halal_worcestershire", "soy_sauce_with_vinegar"],
    conversion_ratio: "1:1",
    category: "flavoring",
    status: "questionable",
    school_of_thought_variation: {},
    inheritance: ["alcohol"],
    notes: "Often fermented with alcohol. Check for halal-certified version",
    quranic_reference: "Surah Al-Ma'idah 5:90",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.5,
    eli5: "This sauce might contain alcohol, so check for halal versions."
  },
  
  teriyaki_sauce: {
    name: "teriyaki_sauce",
    aliases: ["teriyaki_glaze", "teriyaki_marinade"],
    halal_alternatives: ["halal_teriyaki_sauce", "homemade_teriyaki"],
    conversion_ratio: "1:1",
    category: "flavoring",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["alcohol"],
    notes: "Often contains mirin or sake (alcohol). Make homemade halal version",
    quranic_reference: "Surah Al-Ma'idah 5:90",
    hadith_reference: "Sahih Bukhari 7:69:494",
    confidence_score_base: 0.1,
    eli5: "Teriyaki sauce often contains alcohol from mirin or sake."
  },
  
  oyster_sauce: {
    name: "oyster_sauce",
    aliases: ["oyster_sauce", "stir_fry_sauce"],
    halal_alternatives: ["alcohol_free_oyster_sauce", "mushroom_sauce"],
    conversion_ratio: "1:1",
    category: "flavoring",
    status: "questionable",
    school_of_thought_variation: {
      hanafi: "haram", // Shellfish is haram in Hanafi
      shafii: "questionable",
      maliki: "questionable",
      hanbali: "questionable"
    },
    inheritance: [],
    notes: "Some brands contain alcohol. Hanafi school: haram due to shellfish. Others: check for alcohol",
    quranic_reference: "Surah Al-Ma'idah 5:90",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.5,
    eli5: "This sauce contains oysters and might have alcohol, so check for halal versions."
  },
  
  soy_sauce: {
    name: "soy_sauce",
    aliases: ["shoyu", "soy_sauce_fermented"],
    halal_alternatives: ["halal_certified_soy_sauce", "tamari_alcohol_free"],
    conversion_ratio: "1:1",
    category: "flavoring",
    status: "questionable",
    school_of_thought_variation: {},
    inheritance: ["alcohol"],
    notes: "Naturally produces alcohol during fermentation. Most scholars allow if trace amounts",
    quranic_reference: "Surah Al-Ma'idah 5:90",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.8,
    eli5: "Soy sauce naturally has tiny amounts of alcohol from fermentation, but most scholars allow it."
  },
  
  // ============ PROCESSED FOODS ============
  ramen_seasoning: {
    name: "ramen_seasoning",
    aliases: ["instant_noodle_seasoning", "ramen_flavor_packet"],
    halal_alternatives: ["halal_seasoning_mix", "homemade_ramen_seasoning"],
    conversion_ratio: "1:1",
    category: "flavoring",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["pork"],
    notes: "Often contains pork extract or pork-based flavoring",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Bukhari 7:67:400",
    confidence_score_base: 0.1,
    eli5: "Ramen seasoning often contains pork flavoring, which is forbidden."
  },
  
  frozen_lasagna: {
    name: "frozen_lasagna",
    aliases: ["ready_made_lasagna", "prepared_lasagna"],
    halal_alternatives: ["halal_lasagna", "homemade_lasagna"],
    conversion_ratio: "1:1",
    category: "processed_food",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["pork"],
    notes: "Contains pork or non-halal beef. Check ingredients carefully",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Muslim 13:3808",
    confidence_score_base: 0.1,
    eli5: "Frozen lasagna often contains pork or meat that isn't halal."
  },
  
  refried_beans: {
    name: "refried_beans",
    aliases: ["refried_beans_lard"],
    halal_alternatives: ["vegetable_oil_refried_beans", "homemade_refried_beans"],
    conversion_ratio: "1:1",
    category: "processed_food",
    status: "questionable",
    school_of_thought_variation: {},
    inheritance: ["pork"],
    notes: "Lard frequently used. Must check label for vegetable oil version",
    quranic_reference: "Surah Al-Baqarah 2:173",
    hadith_reference: "Sahih Muslim 13:3808",
    confidence_score_base: 0.5,
    eli5: "Refried beans are often cooked with pork fat, so check the label."
  },
  
  // ============ DESSERTS & SWEETS ============
  custard: {
    name: "custard",
    aliases: ["cream_filling", "custard_powder"],
    halal_alternatives: ["halal_custard", "homemade_custard"],
    conversion_ratio: "1:1",
    category: "dessert",
    status: "questionable",
    school_of_thought_variation: {},
    inheritance: ["vanilla_extract"],
    notes: "Check vanilla source (may contain alcohol)",
    quranic_reference: "Surah Al-Baqarah 2:172",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.7,
    eli5: "Custard might contain vanilla extract with alcohol, so check the ingredients."
  },
  
  cake_glaze: {
    name: "cake_glaze",
    aliases: ["mirror_glaze", "sugar_glaze"],
    halal_alternatives: ["fruit_glaze", "sugar_glaze", "chocolate_glaze"],
    conversion_ratio: "1:1",
    category: "dessert",
    status: "questionable",
    school_of_thought_variation: {},
    inheritance: ["alcohol"],
    notes: "Some glazes use alcohol. Use fruit or sugar glazes instead",
    quranic_reference: "Surah Al-Ma'idah 5:90",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.5,
    eli5: "Some cake glazes use alcohol, so check the ingredients."
  },
  
  liqueur_chocolate: {
    name: "liqueur_chocolate",
    aliases: ["alcohol_chocolate", "chocolate_with_liqueur"],
    halal_alternatives: ["halal_chocolate_filling", "chocolate_without_alcohol"],
    conversion_ratio: "1:1",
    category: "dessert",
    status: "haram",
    school_of_thought_variation: {},
    inheritance: ["alcohol"],
    notes: "Contains intoxicants. Avoid all chocolate with alcohol fillings",
    quranic_reference: "Surah Al-Ma'idah 5:90",
    hadith_reference: "Sahih Muslim 10:3893",
    confidence_score_base: 0.1,
    eli5: "This chocolate contains alcohol, which is forbidden."
  }
};

console.log(`Generated ${Object.keys(enhancedIngredients).length} enhanced ingredient entries`);

// Convert to flat format for halal_knowledge.json
const flatKnowledge = {};
Object.entries(enhancedIngredients).forEach(([key, value]) => {
  // Build references array
  const references = [];
  if (value.quranic_reference) references.push(value.quranic_reference);
  if (value.hadith_reference) references.push(value.hadith_reference);
  
  flatKnowledge[key] = {
    status: value.status,
    inheritance: value.inheritance || [],
    alternatives: value.halal_alternatives || [],
    notes: value.notes || "",
    references: references,
    aliases: value.aliases || [],
    confidence_score_base: value.confidence_score_base || 0.5,
    eli5: value.eli5 || "",
    // Enhanced fields
    category: value.category,
    school_of_thought_variation: value.school_of_thought_variation || {},
    conversion_ratio: value.conversion_ratio || "1:1",
    flavor_role: value.flavor_role || "",
    cuisine: value.cuisine || ""
  };
});

// Write flat structure
fs.writeFileSync(outputFlatPath, JSON.stringify(flatKnowledge, null, 2), 'utf8');
console.log(`✅ Created enhanced halal_knowledge.json with ${Object.keys(flatKnowledge).length} entries`);

// Validate JSON
try {
  JSON.parse(fs.readFileSync(outputFlatPath, 'utf8'));
  console.log('✅ JSON validation: PASSED');
} catch (e) {
  console.error('❌ JSON validation: FAILED', e.message);
  process.exit(1);
}

console.log('\nNote: Run convertToNestedJson.cjs to generate nested ingredients.json from this enhanced flat structure');
