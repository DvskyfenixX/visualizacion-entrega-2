document.addEventListener("DOMContentLoaded", function() {
    Promise.all([
        d3.csv("brand.csv"),
        d3.csv("peliculas_mayor_recaudacion.csv")
    ]).then(function([brands, movies]) {
        const processedData = {};
        movies.forEach(movie => {
            const brand = movie.Productora;
            const year = parseInt(movie['Año de estreno']);
            const revenue = parseFloat(movie['Recaudacion mundial (Millones) (USD)']);
            if (!processedData[brand]) {
                processedData[brand] = { years: [], revenues: [], totalRevenue: 0 };
            }
            processedData[brand].years.push(year);
            processedData[brand].revenues.push(revenue);
        });

        brands.forEach(brand => {
            if (processedData[brand.Brand]) {
                processedData[brand.Brand].totalRevenue = parseFloat(brand.Total);
            }
        });

        const traces = Object.keys(processedData).map(brand => {
            const data = processedData[brand];
            return {
                x: data.years,
                y: data.revenues,
                mode: "markers",
                name: brand,
                marker: {
                    size: data.revenues.map(revenue => revenue / 7),
                    sizemode: "area",
                    sizeref: 0.5
                }
            };
        });

        const years = Array.from(new Set(movies.map(movie => parseInt(movie['Año de estreno'])))).sort((a, b) => a - b);
        const frames = years.map(year => {
            const frameData = traces.map(trace => ({
                x: trace.x.filter((_, i) => trace.x[i] <= year),
                y: trace.y.filter((_, i) => trace.x[i] <= year),
                marker: { ...trace.marker, size: trace.marker.size.filter((_, i) => trace.x[i] <= year) },
                name: trace.name
            }));
            return { name: year.toString(), data: frameData };
        });

        const layout = {
            xaxis: {
                title: { text: "Año de estreno", font: { color: "#ffffff", size: 18 } },
                gridcolor: "lightgray",
                color: "#ffffff"
            },
            yaxis: {
                title: { text: "Recaudación mundial (Millones USD)", font: { color: "#ffffff", size: 18 } },
                type: "log",
                gridcolor: "lightgray",
                color: "#ffffff"
            },
            legend: {
                font: { color: "#ffffff" }
            },
            paper_bgcolor: "rgba(0, 0, 0, 0)",
            plot_bgcolor: "#ffffff",
            updatemenus: [{
                type: "buttons",
                showactive: true,
                buttons: [{
                    label: "Play",
                    method: "animate",
                    args: [null, {
                        mode: "immediate",
                        fromcurrent: true,
                        frame: { duration: 500, redraw: true },
                        transition: { duration: 200 }
                    }],
                    bgcolor: "orange",
                }]
            }],
            sliders: [{
                active: 0,
                y: -0.25,  // Mueve la línea de tiempo debajo del texto del eje X
                steps: years.map(year => ({
                    label: year.toString(),
                    method: "animate",
                    args: [[year.toString()], { mode: "immediate", frame: { duration: 1000, redraw: true }, transition: { duration: 300 } }]
                }))
            }],
            autosize: true,
            length: 100000,
            margin: { l: 70, r: 30, t: 20, b: 80 }
        };

        const config = { responsive: true };

        Plotly.newPlot("plot", traces, layout, config).then(function() {
            Plotly.addFrames("plot", frames);
        });
    });
});
