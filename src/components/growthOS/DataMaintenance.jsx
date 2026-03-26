export function scanAndFixData(data, categories) {
  const fixes = {
    datesNormalized: 0,
    invalidValuesFixed: 0,
    orphanedLogsFixed: 0,
  };

  let uncategorizedCategory = categories.find(c => c.id === "uncategorized");
  let categoriesUpdated = [...categories];

  // Create Uncategorized category if needed
  if (!uncategorizedCategory) {
    uncategorizedCategory = {
      id: "uncategorized",
      name: "Uncategorized",
      unit: "count",
      color: "zinc",
      icon: "Circle",
      isActive: true,
    };
  }

  const categoryIds = new Set(categoriesUpdated.map(c => c.id));
  const updatedEntries = data.entries.map(entry => {
    // Normalize date
    const normalizedDate = entry.date.split("T")[0];
    if (normalizedDate !== entry.date) {
      fixes.datesNormalized++;
    }

    // Fix logs
    const fixedLogs = entry.logs.map(log => {
      let fixed = { ...log };

      // Fix invalid values
      if (typeof fixed.value === "number" && (isNaN(fixed.value) || fixed.value < 0)) {
        fixed.value = 0;
        fixes.invalidValuesFixed++;
      }

      // Fix orphaned logs
      if (!categoryIds.has(fixed.categoryId)) {
        if (!categoryIds.has("uncategorized")) {
          categoriesUpdated.push(uncategorizedCategory);
          categoryIds.add("uncategorized");
        }
        fixed.categoryId = "uncategorized";
        fixes.orphanedLogsFixed++;
      }

      return fixed;
    });

    return {
      ...entry,
      date: normalizedDate,
      logs: fixedLogs,
    };
  });

  return {
    data: {
      ...data,
      entries: updatedEntries,
      categories: categoriesUpdated,
    },
    fixes,
  };
}