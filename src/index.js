import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import chroma from "chroma-js";
import _ from "lodash";
import * as d3 from "d3";
import expensesData from "./data/expenses.json";

import "./styles.css";
import { color } from "d3";

const width = 450;
const height = 450;
const radius = 5;
const margin = { left: 20, right: 20, top: 20, bottom: 20 };
const xScale = d3
  .scaleBand()
  .domain([0, 1, 2, 3, 4, 5, 6])
  .range([margin.left, width - margin.right]);
const colorScale = chroma.scale(["#53cf8d", "#f7d283", "#c85151"]);
const amountScale = d3.scaleLog();
function App() {
  const [expenses, setExpenses] = useState([]);
  useEffect(() => {
    let modifiedExpenses = _.chain(expensesData)
      .filter(d => d.Amount < 0)
      .map(d => ({
        amount: -d.Amount,
        description: d.Description,
        date: new Date(d["Trans Date"])
      }))
      .value();
    const amountExtent = d3.extent(modifiedExpenses, d => d.amount);
    amountScale.domain(amountExtent);
    let row = -1;
    modifiedExpenses = _.chain(modifiedExpenses)
      .groupBy(d => d3.timeWeek.floor(d.date))
      .map(modifiedExpenses => {
        row += 1;
        return _.map(modifiedExpenses, exp => {
          return Object.assign(exp, {
            focusX: xScale(exp.date.getDay()),
            focusY: row * 100
          });
        });
      })
      .flatten()
      .value();
    setExpenses(modifiedExpenses);
  }, []);
  return (
    <div>
      <Expenses expenses={expenses} />
    </div>
  );
}

function Expenses({ expenses }) {
  const container = useRef();
  // Similar to componentDidMount and componentDidUpdate:
  useEffect(() => {
    // Update the document title using the browser API
    const svgContainer = d3.select(container.current);
    let circles = svgContainer.selectAll("circle").data(expenses, d => d.name);

    //exit
    circles.exit().remove();
    //enter + update
    circles = circles
      .enter()
      .append("circle")
      .attr("r", radius)
      .attr("fill-opacity", 0.25)
      .attr("stroke-width", 2)
      .merge(circles)
      .attr("fill", d => colorScale(amountScale(d.amount)))
      .attr("stroke", d => colorScale(amountScale(d.amount)));

    const simulation = d3
      .forceSimulation(expenses)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("charge", d3.forceManyBody().strength(-1))
      .force("collide", d3.forceCollide(radius))
      // .force('x', d3.forceX(d => d.focusX))
      // .force('y', d3.forceY(d => d.focusY))
      .stop();

    const forceTick = () => {
      circles.attr("cx", d => d.x).attr("cy", d => d.y);
    };

    simulation.on("tick", forceTick);
    simulation
      .nodes(expenses)
      .alpha(0.9)
      .restart();
  }, [expenses]);
  return <svg width={width} height={height} ref={container} />;
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
