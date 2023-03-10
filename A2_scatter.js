async function drawScatter() {

  // 1. Access data

  const dataset = await d3.json("A2_data.json")

  // set data constants

  // Get data attributes, i.e. xAccesstor for max temperature and yAccessor for min temperature 
  // To DO
  const xAccessor = d => d.temperatureMin
  const yAccessor = d => d.temperatureMax
  const colorScaleYear = 2018
  const parseDate = d3.timeParse("%Y-%m-%d")
  const colorAccessor = d => parseDate(d.date).setYear(colorScaleYear)
  
  // Create chart dimensions

  const width = d3.min([
    window.innerWidth * 0.75,
    window.innerHeight * 0.75,
  ])
  let dimensions = {
    width: width,
    height: width,
    margin: {
      top: 90,
      right: 90,
      bottom: 50,
      left: 50,
    },
    legendWidth: 250,
    legendHeight: 26,
  }
  dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left
    - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height
    - dimensions.margin.top
    - dimensions.margin.bottom

  // Draw 

  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)

  const bounds = wrapper.append("g")
    .style("transform", `translate(${
      dimensions.margin.left
    }px, ${
      dimensions.margin.top
    }px)`)

  const boundsBackground = bounds.append("rect")
      .attr("class", "bounds-background")
      .attr("x", 0)
      .attr("width", dimensions.boundedWidth)
      .attr("y", 0)
      .attr("height", dimensions.boundedHeight)

  // Create scales

  // Create scales for x, y, and color (i.e., xScale, yScale, and colorScale)

  // To DO
  const xScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, dimensions.boundedWidth])

  const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([dimensions.boundedHeight, 0])

  const colorScale = d3.scaleLinear()
      .domain([colorAccessor(dataset[0]), colorAccessor(dataset[364])])
      .range([0, 1])
  
  // 5. Draw data 

  // draw data into a scatter plot

  // To DO
  const dotsGroup = bounds.append("g")
  const dots = dotsGroup.selectAll(".dot")
    .data(dataset)
    .join("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(xAccessor(d)))
      .attr("cy", d => yScale(yAccessor(d)))
      .attr("r", 3)
      .style("fill", d => d3.interpolateRainbow(-colorScale(colorAccessor(d))))
  
  function kernelDensityEstimator(kernel, X) {
    return function(V) {
      return X.map(function(x) {
        return [x, d3.mean(V, function(v) { return kernel(x - v); })];
      });
    };
  }
    
  function kernelEpanechnikov(k) {
    return function(v) {
      return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
  }
    
  const xkde = kernelDensityEstimator(kernelEpanechnikov(7), xScale.ticks(200))
  const ykde = kernelDensityEstimator(kernelEpanechnikov(7), yScale.ticks(200))
  const xdensity =  xkde(dataset.map(d => xAccessor(d)))
  const ydensity =  ykde(dataset.map(d => yAccessor(d)))
  const margin_xScale = d3.scaleLinear()
    .domain([0, d3.max(ydensity, d => d[1])])
    .range([5, 90])
  const margin_yScale = d3.scaleLinear()
    .domain([0, d3.max(xdensity, d => d[1])])
    .range([85, 0])
  const marginsGroup = wrapper.append("g")
  const xmargin = marginsGroup.append("path")
    .attr("class", "xmargin")
    .attr("transform", "translate(" + 50 + "," + 0 + ")")
    .datum(xdensity)
    .attr("fill", "gray")
    .attr("opacity", ".3")
    .attr("d",  d3.line()
      .curve(d3.curveBasis)
        .x(d => xScale(d[0]))
        .y(d => margin_yScale(d[1]))
    )
  const ymargin = marginsGroup.append("path")
    .attr("class", "ymargin")
    .attr("transform", "translate(" + (dimensions.width - 90) + "," + 90 + ")")
    .datum(ydensity)
    .attr("fill", "gray")
    .attr("opacity", ".3")
    .attr("d",  d3.line()
      .curve(d3.curveBasis)
        .x(d => margin_xScale(d[1]))
        .y(d => yScale(d[0]))
    )
  // 6. Draw peripherals

  const xAxisGenerator = d3.axisBottom()
    .scale(xScale)
    .ticks(4)

  const xAxis = bounds.append("g")
    .call(xAxisGenerator)
      .style("transform", `translateY(${dimensions.boundedHeight}px)`)

  const xAxisLabel = xAxis.append("text")
      .attr("class", "x-axis-label")
      .attr("x", dimensions.boundedWidth / 2)
      .attr("y", dimensions.margin.bottom - 10)
      .html("Minimum Temperature (&deg;F)")

  const yAxisGenerator = d3.axisLeft()
    .scale(yScale)
    .ticks(4)

  const yAxis = bounds.append("g")
      .call(yAxisGenerator)

  const yAxisLabel = yAxis.append("text")
      .attr("class", "y-axis-label")
      .attr("x", -dimensions.boundedHeight / 2)
      .attr("y", -dimensions.margin.left + 10)
      .html("Maximum Temperature (&deg;F)")

  const legendGroup = bounds.append("g")
      .attr("transform", `translate(${
        dimensions.boundedWidth - dimensions.legendWidth - 9
      },${
        dimensions.boundedHeight - 37
      })`)

  const defs = wrapper.append("defs")

  const numberOfGradientStops = 10
  const stops = d3.range(numberOfGradientStops).map(i => (
    i / (numberOfGradientStops - 1)
  ))
  const legendGradientId = "legend-gradient"
  const gradient = defs.append("linearGradient")
    .attr("id", legendGradientId)
    .selectAll("stop")
    .data(stops)
    .join("stop")
      .attr("stop-color", d => d3.interpolateRainbow(-d))
      .attr("offset", d => `${d * 100}%`)

  const legendGradient = legendGroup.append("rect")
      .attr("height", dimensions.legendHeight)
      .attr("width", dimensions.legendWidth)
      .style("fill", `url(#${legendGradientId})`)

  const tickValues = [
    d3.timeParse("%m/%d/%Y")(`4/1/${colorScaleYear}`),
    d3.timeParse("%m/%d/%Y")(`7/1/${colorScaleYear}`),
    d3.timeParse("%m/%d/%Y")(`10/1/${colorScaleYear}`),
  ]
  const legendTickScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([0, dimensions.legendWidth])

  const legendValues = legendGroup.selectAll(".legend-value")
    .data(tickValues)
    .join("text")
      .attr("class", "legend-value")
      .attr("x", legendTickScale)
      .attr("y", -6)
      .text(d3.timeFormat("%b"))

  const legendValueTicks = legendGroup.selectAll(".legend-tick")
    .data(tickValues)
    .join("line")
      .attr("class", "legend-tick")
      .attr("x1", legendTickScale)
      .attr("x2", legendTickScale)
      .attr("y1", 6)

  // Set up interactions

  // create voronoi for tooltips
  const delaunay = d3.Delaunay.from(
    dataset,
    d => xScale(xAccessor(d)),
    d => yScale(yAccessor(d)),
  )
  const voronoiPolygons = delaunay.voronoi()
  voronoiPolygons.xmax = dimensions.boundedWidth
  voronoiPolygons.ymax = dimensions.boundedHeight

  const voronoi = dotsGroup.selectAll(".voronoi")
    .data(dataset)
      .join("path")
      .attr("class", "voronoi")
      .attr("d", (d,i) => voronoiPolygons.renderCell(i))

  // add two mouse events in the tooltip

  voronoi.on("mouseenter", onVoronoiMouseEnter)
    .on("mouseleave", onVoronoiMouseLeave)

  const tooltip = d3.select("#tooltip")
  const hoverElementsGroup = bounds.append("g")
      .attr("opacity", 0)

  const dayDot = hoverElementsGroup.append("circle")
      .attr("class", "tooltip-dot")
  
  const marginrectsGroup = marginsGroup.append("g")
      .attr("opacity", 0)

  const dayxRect = marginrectsGroup.append("rect")
      .attr("class", "marginrect")

  const dayyRect = marginrectsGroup.append("rect")
      .attr("class", "marginrect")
  
  function onVoronoiMouseEnter(e, datum) {

    //Given the mouse event and a datum, you are asked to highlight the data by adding an addtioanl circle and display its information (such as date and temperature).

    // To DO
    tooltip
      .style("width", "250px")
      .style("height", "50px")
      .style("left", `${xScale(xAccessor(datum)) - 91}px`)  
      .style("top", `${yScale(yAccessor(datum))}px`)
      .style("opacity", 1)
    
    tooltip.selectAll(".tooltip-date")
      .select("#date")
      .html(d3.timeFormat("%A, %B %d, %Y")(colorAccessor(datum)))
    
    tooltip.selectAll(".tooltip-temperature")
      .select("#min-temperature")
      .html(d3.format(".1f")(xAccessor(datum)))

    tooltip.selectAll(".tooltip-temperature")
      .select("#max-temperature")
      .html(d3.format(".1f")(yAccessor(datum)))
      
    dayDot
      .attr("cx", xScale(xAccessor(datum)))
      .attr("cy", yScale(yAccessor(datum)))
      .attr("r", 5)

    hoverElementsGroup.style("opacity", 1)

    dayxRect
      .attr("width", 8)
      .attr("height", 90)
      .attr("x", xScale(xAccessor(datum) + 11))
      .attr("y", 0)
      .attr("fill", "#8F8BE8")

    dayyRect
      .attr("width", 90)
      .attr("height", 8)
      .attr("x", dimensions.width - 90)
      .attr("y", yScale(yAccessor(datum) - 22))
      .attr("fill", "#8F8BE8")

    marginrectsGroup.style("opacity", 1)
  }

  function onVoronoiMouseLeave() {
    hoverElementsGroup.style("opacity", 0)
    tooltip.style("opacity", 0)
    marginrectsGroup.style("opacity", 0)
  }

  // add two mouse actions on the legend
  legendGradient.on("mousemove", onLegendMouseMove)
    .on("mouseleave", onLegendMouseLeave)

  const legendHighlightBarWidth = dimensions.legendWidth * 0.05
  const legendHighlightGroup = legendGroup.append("g")
      .attr("opacity", 0)
  const legendHighlightBar = legendHighlightGroup.append("rect")
      .attr("class", "legend-highlight-bar")
      .attr("width", legendHighlightBarWidth)
      .attr("height", dimensions.legendHeight)
  const legendHighlightText = legendHighlightGroup.append("text")
      .attr("class", "legend-highlight-text")
      .attr("x", legendHighlightBarWidth / 2)
      .attr("y", -6)
  const marginHighlightGroup = marginsGroup.append("g")
      .attr("opacity", 0)
  const xmarginHighlight = marginHighlightGroup.append("path")
      .attr("class", "marginHighlight")
  const ymarginHighlight = marginHighlightGroup.append("path")
      .attr("class", "marginHighlight")
  function onLegendMouseMove(e) {

    // Display the data only when the data are in the selected date range.

    // To DO
    let startdate, enddate
    const margindataset = []
    const eScale = ((e.pageX - (window.innerWidth - dimensions.width)/2) - (dimensions.boundedWidth - dimensions.legendWidth + 41))/250
    const dateScale = d3.scaleLinear()
      .domain([0, 1])
      .range([colorAccessor(dataset[0]), colorAccessor(dataset[364])])
    if (eScale >= 0.025){
      startdate = dateScale(eScale - 0.025)
    }
    else{
      startdate = colorAccessor(dataset[0])
    }
    if (eScale <= 0.975){
      enddate = dateScale(eScale + 0.025)
    }
    else{
      enddate = colorAccessor(dataset[364])
    }
    const isDayWithinRange = d => {
      // Given a datum, judge whether the datum is in a datum range. Return True or False. 
      // To DO
      if (colorScale(colorAccessor(d)) <= eScale + 0.025 && colorScale(colorAccessor(d)) >= eScale - 0.025){
        return true
      }
      else{
        return false
      }
    }
    legendValues.style("opacity", 0)
    legendValueTicks.style("opacity", 0)
    marginrectsGroup.style("opacity", 0)
    legendHighlightGroup.style("opacity", 1)
    legendHighlightBar
      .attr("x", (eScale - 0.025)*250)
      .attr("y", 0)
    legendHighlightText
      .attr("x", (eScale - 0.025)*250)
      .attr("y", -6)
      .text(d3.timeFormat("%b %d")(startdate) + "-" + d3.timeFormat("%b %d")(enddate))
    dots.data(dataset)
      .style("opacity", d => {if (isDayWithinRange(d)){
        return 1
      }else{
        return 0
      }})
    dataset.forEach(function(d){
      if (isDayWithinRange(d)){
        margindataset.push(d)
      }
      return margindataset	
    })
    const xHighlightdensity = xkde(margindataset.map(d => xAccessor(d)))
    const yHighlightdensity = ykde(margindataset.map(d => yAccessor(d)))
    const marginHighlight_xScale = d3.scaleLinear()
      .domain([0, d3.max(yHighlightdensity, d => d[1])])
      .range([5, 45])
    const marginHighlight_yScale = d3.scaleLinear()
      .domain([0, d3.max(xHighlightdensity, d => d[1])])
      .range([85, 45])
    xmarginHighlight
      .datum(xHighlightdensity)
      .attr("transform", "translate(" + 50 + "," + 0 + ")")
      .attr("fill", "#42F805")
      .attr("opacity", ".6")
      .attr("d",  d3.line()
        .curve(d3.curveBasis)
          .x(d => xScale(d[0]))
          .y(d => marginHighlight_yScale(d[1]))
      )
    ymarginHighlight
      .datum(yHighlightdensity)
      .attr("transform", "translate(" + (dimensions.width - 90) + "," + 90 + ")")
      .attr("fill", "#42F805")
      .attr("opacity", ".6")
      .attr("d",  d3.line()
        .curve(d3.curveBasis)
          .x(d => marginHighlight_xScale(d[1]))
          .y(d => yScale(d[0]))
      )
    marginHighlightGroup.style("opacity", 1)
  }

  function onLegendMouseLeave() {
    dotsGroup.selectAll(".dot")
    .transition().duration(500)
        .style("opacity", 1)
        .attr("r", 3)

    legendValues.style("opacity", 1)
    legendValueTicks.style("opacity", 1)
    legendHighlightGroup.style("opacity", 0)
    marginHighlightGroup.style("opacity", 0)
  }
}
drawScatter()