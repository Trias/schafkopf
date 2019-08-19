function makeChart(fileName) {
    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;


    // set the ranges
    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // define the line
    var valueline = d3.line()
        .x(function (d) {
            return x(d.gameId);
        })
        .y(function (d) {
            return y(d.advantage);
        });

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("body").append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Get the data
    d3.dsvFormat(';');
    d3.dsv(";", `${fileName}.csv`).then((data) => {
        // format the data

        data = data.filter(d => {
            if (fileName === "randomBaseline" && d.strategy === "CallingRulesWithRandomPlay"
                || fileName === "heuristicBaseline" && d.strategy === "CallingRulesWithHeuristic"
            ) {
                return false;
            } else {
                return true;
            }
        });

        data.forEach(function (d) {
            d.advantage = d.wins - d.losses;
        });

        let dataByStrategy = {};

        data.forEach(d => {
            dataByStrategy[d.strategy] = dataByStrategy[d.strategy] || [];
            dataByStrategy[d.strategy].push(d);
        });

        // Scale the range of the data
        y.domain(d3.extent(data, function (d) {
            return d.advantage;
        }));
        x.domain([0, 1000]);

        let colors = ["orange", "blue", "green", "black", "brown", "grey", "darkgreen", "pink", "slateblue", "grey1", "orange"];
        let strategies = Object.keys(dataByStrategy);

        let i = 0;
        for (let strategy of strategies) {
            // Add the valueline path.
            let lineData = dataByStrategy[strategy];
            svg.append("path")
                .data([lineData])
                .attr("class", "line")
                .style("stroke", colors[i])
                .attr("d", valueline);
            i++;
        }
        svg.append("line")
            .attr("class", "zero-line")
            .attr("x1", x(0))
            .attr("y1", y(0))
            .attr("x2", x(1000))
            .attr("y2", y(0));

        // Add the X Axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // Add the Y Axis
        svg.append("g")
            .call(d3.axisLeft(y));

        svg.selectAll("mydots")
            .data(strategies)
            .enter()
            .append("circle")
            .attr("cx", 100)
            .attr("cy", function (d, i) {
                return 100 + i * 25
            }) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("r", 7)
            .style("fill", function (d) {
                return colors[strategies.indexOf(d)]
            });


        // Add one dot in the legend for each name.
        svg.selectAll("mylabels")
            .data(strategies)
            .enter()
            .append("text")
            .attr("x", 120)
            .attr("y", function (d, i) {
                return 100 + i * 25
            }) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", function (d) {
                return colors[strategies.indexOf(d)]
            })
            .text(function (d) {
                return d
            })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
    });
}