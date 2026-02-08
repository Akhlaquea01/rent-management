import { parseShopNumber, getActiveShops } from './reportUtils';

describe('reportUtils', () => {
  describe('parseShopNumber', () => {
    it('should parse simple numbers', () => {
      expect(parseShopNumber('1')).toEqual({ number: 1, suffix: '' });
      expect(parseShopNumber('123')).toEqual({ number: 123, suffix: '' });
    });

    it('should parse numbers with suffixes', () => {
      expect(parseShopNumber('1-A')).toEqual({ number: 1, suffix: 'A' });
      expect(parseShopNumber('10-B')).toEqual({ number: 10, suffix: 'B' });
    });

    it('should handle invalid formats gracefully', () => {
      // Based on implementation, invalid format returns 0 and empty suffix
      expect(parseShopNumber('invalid')).toEqual({ number: 0, suffix: '' });
    });
  });

  describe('getActiveShops', () => {
    it('should return empty array for empty input', () => {
      expect(getActiveShops({})).toEqual([]);
      expect(getActiveShops(undefined)).toEqual([]);
    });

    it('should filter out inactive shops', () => {
      const shops = {
        '1': { tenant: { status: 'Active', name: 'T1' } },
        '2': { tenant: { status: 'Inactive', name: 'T2' } },
        '3': { tenant: { status: 'Active', name: 'T3' } },
      };
      const result = getActiveShops(shops);
      expect(result).toHaveLength(2);
      expect(result.map((s: any) => s.shopNumber)).toEqual(['1', '3']);
    });

    it('should sort shops correctly', () => {
      const shops = {
        '10': { tenant: { status: 'Active' } },
        '1': { tenant: { status: 'Active' } },
        '2': { tenant: { status: 'Active' } },
        '1-B': { tenant: { status: 'Active' } },
        '1-A': { tenant: { status: 'Active' } },
      };
      const result = getActiveShops(shops);
      const shopNumbers = result.map((s: any) => s.shopNumber);
      // Expected order: 1, 1-A, 1-B, 2, 10
      // Note: "1" parses as {number: 1, suffix: ""}. "1-A" as {number: 1, suffix: "A"}.
      // "" comes before "A".
      expect(shopNumbers).toEqual(['1', '1-A', '1-B', '2', '10']);
    });

    it('should handle shops without tenants gracefully (if possible)', () => {
       const shops = {
        '1': { rentAmount: 100 }, // Missing tenant
        '2': { tenant: { status: 'Active' } }
      };
      const result = getActiveShops(shops);
      // Depending on implementation, missing tenant might crash or be filtered out.
      // My implementation checks `shop.tenant && shop.tenant.status === "Active"`, so it should be filtered out.
      expect(result).toHaveLength(1);
      expect(result[0].shopNumber).toEqual('2');
    });
  });
});
