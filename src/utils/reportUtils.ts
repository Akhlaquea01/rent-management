export const parseShopNumber = (shopNum: string) => {
  const match = shopNum.match(/^(\d+)(?:-(\w+))?$/);
  return {
    number: match ? parseInt(match[1], 10) : 0,
    suffix: match?.[2] || ''
  };
};

export const getActiveShops = (selectedYearShops: any) => {
  return Object.entries(selectedYearShops || {})
    .map(([shopNumber, shop]: [string, any]) => ({
      shopNumber,
      ...shop,
    }))
    .filter((shop: any) => shop.tenant && shop.tenant.status === "Active") // Ensure tenant exists
    .sort((a, b) => {
      const shopA = parseShopNumber(a.shopNumber);
      const shopB = parseShopNumber(b.shopNumber);

      if (shopA.number !== shopB.number) {
        return shopA.number - shopB.number;
      }

      return shopA.suffix.localeCompare(shopB.suffix);
    });
};
