'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BoroughData {
    name: string;
    slug: string;
    count: string;
    color: string;
    hoverColor: string;
    labelX: number;
    labelY: number;
}

const BOROUGHS: Record<string, BoroughData> = {
    manhattan: {
        name: 'Manhattan',
        slug: 'manhattan',
        count: '42K',
        color: '#C65D3B',
        hoverColor: '#A8432A',
        labelX: 230,
        labelY: 170,
    },
    bronx: {
        name: 'Bronx',
        slug: 'bronx',
        count: '48K',
        color: '#D4846B',
        hoverColor: '#C65D3B',
        labelX: 315,
        labelY: 95,
    },
    brooklyn: {
        name: 'Brooklyn',
        slug: 'brooklyn',
        count: '82K',
        color: '#B54D2B',
        hoverColor: '#8B3A1F',
        labelX: 250,
        labelY: 320,
    },
    queens: {
        name: 'Queens',
        slug: 'queens',
        count: '78K',
        color: '#A8432A',
        hoverColor: '#7A2E1D',
        labelX: 340,
        labelY: 240,
    },
    statenisland: {
        name: 'Staten Island',
        slug: 'staten-island',
        count: '18K',
        color: '#E09070',
        hoverColor: '#D4846B',
        labelX: 100,
        labelY: 400,
    },
};

// Accurate NYC borough SVG paths from official GeoJSON boundary data
const BOROUGH_PATHS: Record<string, string> = {
    statenisland: `M147.9,313.1 L155.8,318.3 L154.5,326.0 L161.5,347.6 L168.8,360.7 L153.6,389.1 L154.5,389.8 L150.5,393.4 L130.0,416.3 L107.2,443.2 L111.4,434.3 L109.8,435.6 L111.9,433.8 L107.9,425.0 L106.3,426.5 L106.0,427.0 L106.4,428.0 L105.4,428.1 L104.5,429.0 L103.6,429.4 L103.6,430.6 L104.0,431.7 L104.4,434.9 L96.4,440.5 L89.0,446.0 L76.4,453.8 L65.4,463.9 L53.9,463.9 L51.0,468.7 L44.1,473.0 L38.9,473.5 L33.2,476.7 L23.5,477.9 L21.4,465.5 L23.9,459.4 L27.1,457.2 L29.4,449.3 L30.1,442.6 L29.7,437.6 L28.7,436.1 L27.8,434.9 L27.0,430.3 L32.5,422.0 L35.7,417.8 L39.4,414.6 L45.0,414.8 L47.0,415.6 L51.4,413.1 L52.1,411.8 L52.6,409.7 L52.8,407.3 L53.9,402.1 L55.1,398.3 L56.4,390.6 L57.3,385.6 L57.8,381.9 L59.5,376.1 L61.9,371.6 L60.4,346.3 L60.3,343.3 L60.3,338.3 L60.9,331.7 L63.2,328.8 L65.1,325.0 L72.7,318.6 L72.9,319.1 L73.1,317.6 L75.3,317.2 L76.2,318.8 L77.0,319.7 L78.5,319.6 L79.5,316.5 L81.2,318.9 L82.1,320.3 L82.0,321.1 L90.6,322.3 L97.1,323.8 L107.2,321.0 L118.0,321.3 L122.0,320.4 L140.0,315.7 L147.9,313.1 Z`,

    queens: `M341.1,145.6 L343.2,147.3 L345.5,149.0 L347.3,148.8 L349.8,150.2 L353.3,150.5 L355.3,150.6 L357.1,151.1 L359.8,152.1 L360.0,155.1 L369.1,156.2 L373.4,150.7 L376.7,156.5 L389.1,183.6 L396.9,193.8 L394.6,189.9 L389.5,182.6 L389.6,179.7 L419.6,190.3 L399.9,327.5 L397.2,324.8 L395.2,325.3 L395.4,319.5 L390.7,314.4 L393.3,327.8 L387.4,331.2 L383.1,333.7 L380.7,335.8 L378.9,341.7 L376.9,340.6 L367.5,346.3 L364.5,355.1 L356.3,353.1 L358.0,347.9 L359.8,342.2 L360.3,325.9 L342.5,299.1 L338.4,302.1 L337.4,311.3 L334.0,305.6 L334.1,301.0 L328.1,306.6 L319.7,309.6 L311.0,304.2 L311.5,301.9 L311.5,302.6 L277.0,259.2 L264.7,234.9 L264.0,232.1 L265.9,230.5 L266.3,230.0 L250.9,216.5 L243.4,212.9 L236.6,214.2 L239.1,205.3 L285.0,162.0 L285.6,164.8 L286.5,164.0 L286.4,164.3 L285.4,165.3 L287.0,166.0 L288.5,168.2 L292.9,175.1 L315.5,177.6 L313.2,186.8 L319.9,190.2 L319.6,179.8 L319.6,169.3 L319.4,167.5 L315.6,166.5 L312.7,162.5 L314.7,160.8 L317.3,156.5 L324.6,152.0 L328.8,158.3 L332.4,159.1 L335.3,154.9 L335.0,151.2 L336.0,150.2 L337.8,149.5 L339.5,147.9 L341.1,145.6 Z`,

    brooklyn: `M242.3,213.5 L249.6,216.6 L261.4,237.1 L259.9,246.7 L264.5,236.9 L285.1,275.6 L309.7,304.3 L305.1,325.1 L297.0,320.6 L291.3,313.5 L288.9,312.2 L291.0,314.8 L291.4,316.7 L296.9,329.9 L278.8,338.1 L281.2,341.0 L282.8,342.2 L285.4,345.4 L285.7,350.3 L286.9,353.7 L288.3,356.1 L286.6,359.0 L282.1,356.8 L278.1,349.5 L278.2,359.4 L270.1,357.7 L269.9,360.2 L274.3,363.4 L275.2,363.7 L284.0,362.3 L289.0,361.9 L295.6,365.4 L291.5,390.1 L283.0,379.8 L278.1,379.7 L273.8,377.5 L273.6,373.8 L273.3,371.3 L272.4,369.4 L271.6,368.1 L269.9,366.2 L267.8,364.9 L266.0,364.1 L264.8,366.1 L262.2,364.4 L261.0,362.0 L260.1,364.8 L262.6,366.6 L265.8,370.4 L267.4,371.8 L269.6,374.7 L271.4,377.0 L267.7,381.4 L262.3,379.5 L261.1,378.1 L260.2,374.0 L259.3,372.4 L259.5,377.8 L264.3,382.9 L268.5,382.4 L271.5,381.1 L272.8,384.6 L270.6,385.1 L273.0,384.7 L265.1,384.2 L255.8,384.7 L248.9,384.1 L249.5,393.2 L226.4,396.8 L208.8,398.4 L216.2,388.9 L210.1,380.0 L182.9,356.7 L189.5,310.0 L205.5,297.3 L203.6,293.5 L194.7,283.7 L209.0,260.1 L226.7,253.1 L233.3,236.6 L242.1,213.5 L242.3,213.5 Z`,

    manhattan: `M262.9,61.6 L265.3,62.1 L265.8,65.5 L267.7,66.2 L267.1,65.1 L266.9,64.1 L268.2,65.9 L268.4,66.2 L268.6,66.4 L269.0,65.8 L272.6,65.6 L274.7,68.3 L274.4,69.9 L274.2,71.0 L273.7,72.4 L271.0,76.4 L270.8,77.7 L269.4,79.5 L268.1,82.0 L266.5,80.8 L266.3,81.9 L266.9,82.7 L267.2,83.4 L267.0,83.5 L266.3,84.2 L266.3,84.9 L263.0,91.7 L257.6,105.5 L256.5,110.6 L256.9,115.4 L257.3,125.1 L257.3,132.7 L260.1,142.6 L258.8,153.7 L253.0,162.9 L250.4,165.2 L239.6,191.7 L231.7,205.1 L229.9,207.9 L229.3,210.0 L228.8,215.6 L228.7,217.4 L227.9,219.9 L229.6,224.2 L228.6,233.3 L218.5,246.2 L209.0,248.0 L205.9,250.4 L204.6,252.1 L202.5,255.7 L200.0,255.5 L199.0,256.6 L197.9,256.0 L195.9,253.3 L195.5,251.3 L194.8,248.7 L195.6,242.1 L198.2,234.0 L200.6,219.8 L200.7,213.4 L201.5,208.9 L200.8,207.0 L201.7,205.8 L201.5,201.5 L202.9,196.8 L207.0,188.7 L210.3,183.6 L211.3,176.1 L214.5,173.0 L219.2,163.0 L226.7,147.2 L232.9,134.2 L239.5,122.1 L245.3,109.1 L247.2,101.6 L248.2,96.0 L247.8,91.2 L248.9,90.3 L251.6,87.4 L256.8,76.4 L258.4,71.4 L262.9,61.6 Z`,

    bronx: `M302.4,32.2 L314.5,30.2 L327.0,40.0 L354.3,69.4 L366.6,64.3 L361.0,80.7 L357.8,89.7 L353.2,86.2 L351.0,80.6 L350.6,82.4 L347.3,77.9 L345.9,76.7 L343.5,89.9 L344.9,93.2 L344.7,95.9 L345.1,96.7 L346.4,97.1 L346.9,96.5 L347.3,95.7 L346.6,97.6 L346.2,98.1 L344.7,98.1 L343.9,98.3 L343.1,98.2 L344.7,100.8 L345.6,103.2 L344.7,107.3 L344.4,109.8 L345.2,112.4 L346.1,114.4 L348.0,115.7 L347.6,116.0 L345.9,118.1 L346.0,120.3 L348.1,119.6 L351.1,119.2 L351.7,121.7 L355.8,127.1 L353.8,133.0 L353.6,131.9 L353.0,130.6 L352.6,130.3 L351.2,128.9 L362.6,139.0 L360.3,141.2 L352.1,136.0 L347.2,132.4 L343.0,131.9 L340.5,132.6 L337.8,134.0 L333.8,134.9 L332.8,141.3 L326.4,133.1 L327.4,124.0 L327.3,110.3 L326.9,107.1 L327.1,108.3 L325.7,119.1 L323.8,130.5 L317.3,131.7 L319.5,136.1 L320.8,140.0 L314.8,141.7 L313.1,139.9 L312.6,135.7 L311.6,136.2 L298.7,144.2 L293.2,144.2 L288.0,139.7 L285.7,139.5 L283.7,140.6 L280.9,141.5 L279.4,142.9 L276.7,147.3 L268.5,147.9 L258.5,123.0 L262.2,96.0 L271.6,78.7 L268.9,63.5 L266.3,54.0 L274.0,21.9 L302.4,32.2 Z`,
};

export function NYCBoroughMap() {
    const router = useRouter();
    const [hoveredBorough, setHoveredBorough] = useState<string | null>(null);

    const handleClick = (slug: string) => {
        router.push(`/borough/${slug}`);
    };

    return (
        <div className="relative w-full max-w-md mx-auto">
            {/* Map container with subtle shadow */}
            <div className="relative bg-[#E8E3D9] rounded-xl p-3 shadow-lg border border-[#D4CFC4]">
                <svg
                    viewBox="0 0 440 500"
                    className="w-full h-auto"
                    role="img"
                    aria-label="Interactive map of NYC boroughs"
                >
                    {/* Background - warm beige to match site theme */}
                    <rect x="0" y="0" width="440" height="500" fill="#E8E3D9" rx="8" />

                    {/* Borough paths with shadows and interactivity */}
                    {Object.entries(BOROUGH_PATHS).map(([key, path]) => {
                        const borough = BOROUGHS[key];
                        const isHovered = hoveredBorough === key;

                        return (
                            <g key={key}>
                                {/* Drop shadow */}
                                <path
                                    d={path}
                                    fill="rgba(0,0,0,0.12)"
                                    transform="translate(2, 2)"
                                    className="pointer-events-none"
                                />

                                {/* Main borough shape */}
                                <path
                                    d={path}
                                    fill={isHovered ? borough.hoverColor : borough.color}
                                    stroke={isHovered ? "#FAF7F2" : "#E8E3D9"}
                                    strokeWidth={isHovered ? "2.5" : "1.5"}
                                    className="cursor-pointer transition-all duration-200"
                                    onMouseEnter={() => setHoveredBorough(key)}
                                    onMouseLeave={() => setHoveredBorough(null)}
                                    onClick={() => handleClick(borough.slug)}
                                />
                            </g>
                        );
                    })}

                    {/* Borough labels */}
                    {Object.entries(BOROUGHS).map(([key, borough]) => (
                        <text
                            key={key}
                            x={borough.labelX}
                            y={borough.labelY}
                            className="fill-white font-bold pointer-events-none select-none"
                            style={{
                                fontSize: key === 'statenisland' ? '8px' : '9px',
                                letterSpacing: '0.5px',
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            }}
                            textAnchor="middle"
                        >
                            {borough.name.toUpperCase()}
                        </text>
                    ))}
                </svg>

                {/* Hover tooltip */}
                {hoveredBorough && BOROUGHS[hoveredBorough] && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white px-4 py-2 rounded-lg shadow-xl z-20 min-w-[130px] text-center">
                        <div className="font-serif font-bold">{BOROUGHS[hoveredBorough].name}</div>
                        <div className="text-xs text-[#B0B0B0]">{BOROUGHS[hoveredBorough].count} buildings</div>
                        <div className="text-[10px] text-[#C65D3B] mt-1 font-medium">Click to explore →</div>
                    </div>
                )}
            </div>

            <p className="text-center text-xs text-[#8A8A8A] mt-2">
                Click any borough to explore
            </p>
        </div>
    );
}
