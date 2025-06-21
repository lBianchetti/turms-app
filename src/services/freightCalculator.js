export const calculateFreight = (settings, { weight, size, destinationLabel }) => {
    if (!settings || !weight || !destinationLabel) {
        // Retorna 0 se faltarem dados essenciais para o cálculo
        return 0;
    }

    let total = 0;
    
    // 1. Valor Base
    total += settings.baseRate || 0;

    // 2. Adicional por Tamanho
    total += settings.sizeRates[size] || 0;
    
    // 3. Adicional por Peso
    const weightNum = parseFloat(weight);
    if (!isNaN(weightNum)) {
        const weightTier = settings.weightTiers.find(tier => weightNum > tier.from && weightNum <= tier.to);
        if (weightTier) {
            total += weightTier.rate;
        }
    }

    // 4. Adicional por Zona (baseado em texto)
    const destAddress = destinationLabel.toLowerCase();
    const zoneTier = settings.zoneRates.find(zone => destAddress.includes(zone.zone.toLowerCase()));
    if(zoneTier) {
        total += zoneTier.rate;
    }

    // 5. Adicional Noturno
    const currentHour = new Date().getHours();
    if (currentHour >= 18 || currentHour < 6) {
        total += settings.nightRate || 0;
    }

    return total.toFixed(2);
};
