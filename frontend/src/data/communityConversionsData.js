/**
 * Example data for Community Conversions (homepage social proof).
 * In production, replace with API response or server-driven feed.
 * All entries are anonymous (no user names).
 *
 * Data format:
 * @typedef {Object} CommunityConversionItem
 * @property {string} id - Unique id
 * @property {string} title - Recipe or dish name (e.g. "Carbonara", "Butter chicken")
 * @property {'converted'|'verified'} type - "converted" = converted to halal, "verified" = verified halal
 * @property {number} [saves] - Optional count of saves
 * @property {number} [shares] - Optional count of shares
 */

export const COMMUNITY_CONVERSIONS_MOCK = [
  { id: "1", title: "Carbonara", type: "converted", saves: 12, shares: 3 },
  { id: "2", title: "Butter chicken", type: "verified", saves: 8, shares: 5 },
  { id: "3", title: "Beef bourguignon", type: "converted", saves: 6 },
  { id: "4", title: "Pad Thai", type: "converted", saves: 15, shares: 2 },
  { id: "5", title: "Chicken tikka masala", type: "verified", saves: 22, shares: 8 },
  { id: "6", title: "Marshmallow brownies", type: "converted", saves: 4 },
  { id: "7", title: "Panna cotta", type: "converted", saves: 9, shares: 1 },
];
