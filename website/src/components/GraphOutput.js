import React, { Component } from 'react'
import * as d3 from 'd3'
import PubSub from 'pubsub-js';
import { data_spoon as data } from './data'
const ONLY_TESTS_DECLS = false;
class GraphChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  componentDidMount() {
    // const data = [2, 4, 2, 6, 8]
    window.reloadGraph = (x, state = {}) => {
      console.log("reloadGraph", x, JSON.stringify(x))
      const data = {
        ...state,
        // nodes: [],
        links: [],
        roots: x.roots,
        tests: x.tests,
        byId: {}

      }
      let max_depth = 0
      if (ONLY_TESTS_DECLS) {
        const testsDecls = {}
        const removedReplacers = {}
        data.nodes = [];
        x.perRoot.forEach(z => {
          z.vertices.forEach(y => {
            // data.roots.push(x.)
            max_depth = Math.max(max_depth, y.depth)
            y.root = z.root
            y.originalId = y.id
            if (y.id === z.root) {
              y.isRoot = true
            }
            if (y.value && y.value.position && y.value.position.isTest) {
              if (testsDecls["" + z.root + " " + y.value.position.method.id]) {
                testsDecls["" + z.root + " " + y.value.position.method.id].pointedCount += 1
                testsDecls["" + z.root + " " + y.value.position.method.id].depth = Math.max(y.depth, testsDecls["" + z.root + " " + y.value.position.method.id].depth)
              } else {
                testsDecls["" + z.root + " " + y.value.position.method.id] = y.value.position.method
                testsDecls["" + z.root + " " + y.value.position.method.id].causes = []
                testsDecls["" + z.root + " " + y.value.position.method.id].effects = []
                testsDecls["" + z.root + " " + y.value.position.method.id].root = y.root
                testsDecls["" + z.root + " " + y.value.position.method.id].isTest = true
                testsDecls["" + z.root + " " + y.value.position.method.id].depth = y.depth
                testsDecls["" + z.root + " " + y.value.position.method.id].pointedCount = 1
              }
              testsDecls["" + z.root + " " + y.value.position.method.id].causes.push(y.id)
              removedReplacers[z.root] = removedReplacers[z.root] || {}
              removedReplacers[z.root][y.id] = "" + z.root + " " + y.value.position.method.id
            } else {
              data.nodes.push(y)
            }
          });
        });
        data.nodes.forEach(x => {
          x.causes.forEach(y => {
            const o = {
              target: (removedReplacers[x.root][y] || ("" + x.root + " " + y)),
              source: x
            }
            if (removedReplacers[x.root][y]) {
              o.count = testsDecls[removedReplacers[x.root][y]].pointedCount
            }
            data.links.push(o)
          })
          x.effects.forEach(y => {
            if (removedReplacers[x.root][y]) {
              const o = {
                target: (removedReplacers[x.root][y] || ("" + x.root + " " + y)),
                source: x
              }
              // o.count = testsDecls[removedReplacers[x.root][y]].pointedCount
              data.links.push(o)
            }
          })
        });
        data.nodes = data.nodes.concat(Object.values(testsDecls))
        data.nodes.forEach(x => {
          x.id = "" + x.root + " " + x.originalId
        })
      } else {
        data.nodes = []
        const missing = {}
        x.perRoot.forEach(z => {
          z.vertices.forEach(x => {
            x.isRoot = x.id === z.root
            x.causes2 = []
            x.effects2 = []
            x.root = z.root
            x.originalId = x.id
            x.id = "" + z.root + " " + x.id
            data.byId[x.id] = x
            max_depth = Math.max(max_depth, x.depth)
            // x.effects.forEach(y => {
            //   data.links.push({
            //     target: x.id,
            //     source: y
            //   })
            // });
            x.causes = x.causes.map(y => {
              const tmp = "" + x.root + " " + y;
              data.links.push({
                target: x,
                source: tmp
              })
              data.byId[tmp] = data.byId[tmp] || {
                // ...x, 
                "value": {
                  "sig": {
                    "declType": "declType",
                    "signature": "signature()",
                    "name": "name",
                    "id": 111111111111
                  },
                  "position": {
                    "isTest": true,
                    "file": "file",
                    "start": 1111111,
                    "end": 11111111,
                    "method": {
                      "declType": "declType",
                      "signature": "signature",
                      "name": "name",
                      "id": 111111111111111
                    }
                  }
                },
                "causes": x.causes,
                "effects": x.effects,
                "isRoot": x.isRoot,
                "depth": x.depth,
                causes2: [],
                effects2: [],
                name: tmp,
                id: tmp,
                originalId: y,
                root: x.root,
                missing: true,
              }
              return tmp
            })
          });
          // data.nodes = data.nodes.concat(z.vertices)
        });
        data.nodes = Object.values(data.byId);
      }
      return this.drawGraphChart(data);
    }
    window.reloadGraph(data)
  }
  drawGraphChart(data, max_depth) {
    console.log(data, JSON.stringify(data))
    const _this = this;

    let width = 400;
    let height = 600;
    let color = d3.scaleOrdinal(d3.schemeCategory10);

    const _graph = data
    // document.createElement("div").innerHTML = JSON.stringify(_graph, undefined, '    ');
    // document.createElement("div").addEventListener("input",
    //   function () {
    //     try {
    //       run(JSON.parse(this.value))
    //       this.style.backgroundColor = ""
    //     } catch (error) {
    //       console.error(error)
    //       this.style.backgroundColor = "hsl(0,54%,71%)"
    //     }
    //   })


    // let label = {
    //     'nodes': [],
    //     'links': []
    // };

    // graph.nodes.forEach(function(d, i) {
    //     label.nodes.push({node: d});
    //     label.nodes.push({node: d});
    //     label.links.push({
    //         source: i * 2,
    //         target: i * 2 + 1
    //     });
    // });

    function isTest(d) {
      return d.isTest || (d.value
        && d.value.position
        && d.value.position.isTest)
    }

    var y = d3.scaleLinear()
      .domain([1, 30])
      .range([20, height / 5 - 20]);

    // let labelLayout = d3.forceSimulation(label.nodes)
    //     .force("charge", d3.forceManyBody().strength(-50))
    //     .force("link", d3.forceLink(label.links).distance(0).strength(2));



    function run(graph = _graph) {
      _this.refs.canvas &&
        (_this.refs.canvas.innerHTML = '');


      const zetgzerfg = {}
      graph.roots.forEach((x, i) => zetgzerfg[x] = i)

      const graphLayout = d3.forceSimulation(graph.nodes)
        // .alphaDecay(1 - Math.pow(0.001, 1 / 100))
        // .force('charge', d3.forceManyBody().strength(.5))
        .force("charge", d3.forceManyBody().distanceMin(1000)
          .strength(d => isTest(d) ? (d.isTest ? -40 : -40) : -5000))
        //   .strength(d => d.isRoot ? -100 : -50))
        // .force("test", isolate(
        //   d3.forceManyBody().distanceMax(800)
        //     .strength(d => -800),
        //   function (d) {
        //     return isTest(d);
        //   }))
        // .force("src", isolate(
        //   d3.forceManyBody().distanceMax(800)
        //     .strength(d => isTest(d) ? (d.isTest ? -800 : -800) : -2000),
        //   function (d) {
        //     return !isTest(d)
        //   }))
        // .force("roots", isolate(
        //   d3.forceManyBody().distanceMax(2000)
        //     .strength(d => -100000),
        //   function (d) {
        //     return d.isRoot
        //   }))
        // .force("steelblue", isolate(d3.forceX(width / 6), function(d) { return d.color === "steelblue"; }))
        // .force("center", d3.forceCenter(width / 2, height / 2))
        .force("y", d3.forceY(d => {
          // if (isTest(d)) {
          //   return 0//y(d.index + 100)
          // }
          // // if (isTest(d)) {
          // //   return 1//y(d.index + 100)
          // // }
          // // else if ((graph.roots || []).includes(d.id)) {
          // //   return height//y(d.index - 100)
          // // }
          // return height * .5 + height * .5 / ((d.depth || 1) + 1)

          // // }).strength(d=>1-d.depth/(max_depth||d.depth)*.4))
          if (isTest(d)) {
            return 300 * d.depth - 50
          }
          return 300 * d.depth
        }).strength(d => isTest(d) ? .8 : 1.))
        .force("x", d3.forceX(d => {
          return zetgzerfg[d.root] * 1000 //(width / graph.roots.length) * 40
        }).strength(d=>d.isRoot ? (1) : .2))
        // // .force("y", d3.forceY(height / 2).strength(1))
        // .force("collision", d3.forceCollide(40)
        //   // .radius(d => (isTest(d) ? (d.isTest ? 10 : 10) : 10) * NODE_SIZE)
        //   // .strength(d => isTest(d) ? (d.isTest ? 1 : 1) : .5)
        // )
        .force("link", d3.forceLink(graph.links)
          .id(function (d) { return d.id; })
          .distance(d => isTest(d) ? 10 : 20).strength(.1));


      const adjlist = [];

      graph.links.forEach(function (d) {
        adjlist[d.source.index + "-" + d.target.index] = true;
        adjlist[d.target.index + "-" + d.source.index] = true;
        d.target.causes2.push(d);
        d.source.effects2.push(d);
      });

      // const zdazdaz = []
      // for (let i = 1; i < graph.roots.length; i++) {
      //   zdazdaz.push({
      //     source: graph.roots[i - 1] + " " + graph.roots[i - 1],
      //     target: graph.roots[i] + " " + graph.roots[i]
      //   })
      // }
      // graphLayout
      //   .force("link-roots", d3.forceLink(zdazdaz)
      //     .id(function (d) { return d.id; })
      //     .distance(d => 3 * size(d.target) * size(d.source)).strength(.3));


      // function size(d) {
      //   if (d.effects2.length <= 0) {
      //     return 1
      //   }
      //   let r = 0
      //   d.effects2.forEach(x => {
      //     Math.max(r, size(x.target))
      //   })
      //   return r
      // }
      // graph.roots.forEach(element => {
      //   graphLayout.force("g" + element, isolate(
      //     d3.forceManyBody().distanceMax(10000)
      //       .strength(d => 5000),
      //     function (d) {
      //       return d.root == element
      //     }))
      // });

      setTimeout(function () {
        graphLayout
          // .force("x", null)
        graphLayout.restart();
      }, 1000)
      setTimeout(function () {
        graph.roots.forEach(element => {
          graphLayout.force("g" + element, null)
        });
        graphLayout
          .force("charge", d3.forceManyBody().distanceMin(1000)
            .strength(d => 5000))
          .force("charge", d3.forceManyBody().distanceMax(1000)
            .strength(d => -5000))
          .force("link", d3.forceLink(graph.links)
            .id(function (d) { return d.id; })
            .distance(d => isTest(d) ? 10 : 20).strength(.8))
          .force("collision", d3.forceCollide(40)
            // .radius(d => (isTest(d) ? (d.isTest ? 10 : 10) : 10) * NODE_SIZE)
            // .strength(d => isTest(d) ? (d.isTest ? 1 : 1) : .5)
          )
        graphLayout.restart();
      }, 5000)

      graphLayout
        .on("tick", ticked)
        .alpha(3);

      function isolate(force, filter) {
        var initialize = force.initialize;
        force.initialize = function () {
          initialize.call(force, graph.nodes.filter(filter));
        };
        return force;
      }


      function neigh(a, b) {
        return a == b || adjlist[a + "-" + b];
      }

      const svg = d3.select(_this.refs.canvas).attr("width", width).attr("height", height);
      const container = svg.append("g");

      svg.call(
        d3.zoom()
          .scaleExtent([.1, 4])
          .on("zoom", function () { container.attr("transform", d3.event.transform); })
      );

      var filter = svg.append("defs").append("filter")
        .attr("x", "-.03")
        .attr("y", "-.1")
        .attr("width", "1.06")
        .attr("height", "1.2")
        .attr("id", "background")//id of the filter
      filter.append("feFlood")
        .attr("flood-color", "black");
      filter.append("feComposite")
        .attr("in", "SourceGraphic");

      const NODE_SIZE = 40

      const links = container.append("g").attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        // .data([])
        .enter()
        .append("line")
        .attr("stroke", function (d) {
          return isTest(d.target) || isTest(d.source) ? "darkgray" : "black"
        })
        .attr("stroke-width", "5px");

      const nodes = container.append("g").attr("class", "nodes")
        .selectAll("g")
        .data(graph.nodes)
        // .data(graph.roots.map(x => (graph.byId[x + " " + x])))
        .enter()
        .append("g")
        .style("transform-origin", "center");

      nodes.call(addContent);

      function addContent(/** @type {d3.Selection<SVGGElement, any, SVGGElement, any>} */node) {
        if (true) {
          const evo_nodes = node
            .filter(d => {
              if (typeof d.evolution !== "object") {
                return false
              }
              return true
            })
          evo_nodes
            .append("text")
            .style("transform-origin", "center")
            .style("font-weight", 900)
            .style("font-size", "120px")
            .style("font-family", "sans-serif")
            .attr("fill", d => {
              return "green"
            })
            .text(d => {
              if (d.evolution.type === "Move Method") {
                return "MM"
              }
              try {
                return d.evolution.type.split(" ").map(x => x[0]).join("")
              } catch (error) {
                return "O"
              }
            })
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .append("svg:title")
            .text(function (d, i) {
              return d.evolution.type
            })
          const other_nodes = node
            .filter(d => {
              if (typeof d.evolution !== "object") {
                return true
              }
              return false
            })
          other_nodes
            .append("circle")
            // .attr("x", function (d) { return -NODE_SIZE * (d.scale || 1) / 2; })
            // .attr("y", function (d) { return -NODE_SIZE * (d.scale || 1) / 2; })
            .attr("r", function (d) { return d.missing ? 0 : NODE_SIZE / 2; })
          evo_nodes
            .append("text")
            .style("transform-origin", "center")
            .attr("dominant-baseline", "middle")
            .style("font-weight", "bolder")
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .text(d => {
              if (typeof d.name === "string") {
                return d.name
              }
              const value = d.value
              if (typeof value === "string") {
                return value
              }
              if (typeof value.name === "string") {
                return value.name
              }
              if (typeof value.sig === "string") {
                return value.sig
              }
              return value.sig.name
            })
            .append("svg:title")
            .text(function (d, i) {
              if (typeof d.signature === "string") {
                return d.declType + '.' + d.signature
              }
              const value = d.value
              if (typeof value === "string") {
                return value
              }
              if (typeof value.signature === "string") {
                return value.declType + '.' + value.signature
              }
              if (typeof value.sig === "string") {
                return value.sig
              }
              return value.sig.declType + '.' + value.sig.signature
            })

          other_nodes
            .append("text")
            .style("transform-origin", "center")
            .attr("fill", d => {
              if (d.isTest) {
                return "red"
              } else if (isTest(d)) {
                return "orange"
              } else if (d.isRoot) {
                return "green"
                // } else if (data.roots.includes(d.originalId)) {
                //   return "green"
                // } else if (d.depth === 1) {
                //   return "green"
                // } else if (d.root === d.originalId ) {
                //   return "green"
                // } else if (d.causes.length === 0) {
                //   return "green"
              }
              return "white"
            })
            .text(d => {
              if (typeof d.name === "string") {
                return d.name
              }
              const value = d.value
              if (typeof value === "string") {
                return value
              }
              if (typeof value.name === "string") {
                return value.name
              }
              if (typeof value.sig === "string") {
                return value.sig
              }
              return value.sig.name
            })
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .attr("filter", "url(#background)")
            .append("svg:title")
            .text(function (d, i) {
              if (typeof d.signature === "string") {
                return d.declType + '.' + d.signature
              }
              const value = d.value
              if (typeof value === "string") {
                return value
              }
              if (typeof value.signature === "string") {
                return value.declType + '.' + value.signature
              }
              if (typeof value.sig === "string") {
                return value.sig
              }
              return value.sig.declType + '.' + value.sig.signature
            });
        } else {
          node
            .append("svg:image")
            .attr("xlink:href", function (d) { return "https://p.bigstockphoto.com/GeFvQkBbSLaMdpKXF1Zv_bigstock-Aerial-View-Of-Blue-Lakes-And--227291596.jpg"/*DIR + d.img*/; })
            .attr("x", function (d) { return -NODE_SIZE * (d.scale || 1) / 2; })
            .attr("y", function (d) { return -NODE_SIZE * (d.scale || 1) / 2; })
            .attr("height", function (d) { return NODE_SIZE * (d.scale || 1); })
            .attr("width", function (d) { return NODE_SIZE * (d.scale || 1); })
            .attr("transform", function (d) {
              return `scale(${Math.random() > 0.5 ? -1 : 1},1)`;
            });
        }
      }
      // .append("circle")
      // .attr("r", 5)
      // .attr("fill", function(d) { return color(d.group); })

      // node.on("mouseover", focus).on("mouseout", unfocus);


      // const linksText =
      //   container.append("g").attr("class", "labels")
      //     .selectAll("text")
      //     .data(graph.links)
      //     .enter()
      //     .append("text")
      //     .attr("class", "link-label")
      //     .attr("font-family", "Arial, Helvetica, sans-serif")
      //     .attr("fill", "black")
      //     .style("font", "bold 14px Arial")
      //     .attr("dy", ".35em")
      //     .attr("text-anchor", "middle")
      // .text(function (d) {
      //   return d.count && d.count > 1 ? "" + d.count : "";
      // });

      nodes.call(
        d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

      nodes.on("dblclick", dblclick)

      // nodes.call(incremental)
      // setTimeout(function () {
      //   graphLayout.force("charge", d3.forceManyBody().distanceMax(1000)
      //     // .strength(d => isTest(d) ? (d.isTest ? -800 : -800) : -2000))
      //     .strength(d => d.isRoot ? -1000 : -500))
      //   graphLayout.restart();
      //   setTimeout(function () {
      //   }, 10000)
      // }, 10000)
      const cont_nodes = container.select(".nodes")
      const cont_links = container.select(".links")
      /**
       * 
       * @param {d3.Selection} currents 
       */
      function incremental(currents) {
        setTimeout(function () {
          currents.each(function (x) {
            x.effects2.forEach(eff => {
              const e = eff.target
              const n = addNode(e, x)
              addLink(eff)
              n.call(incremental)
            })
          })
          // graphLayout.alpha(1);
          // graphLayout.restart();
        },
          3
        )
      }
      function addNode(x, y) {
        return cont_nodes.append("g")
          .datum(x)//{...x, "x":y.x,"y":y.y,"vx":y.vx,"vy":y.vy})
          .style("transform-origin", "center")
          .attr("transform", function (d) {
            d.x = y.x
            d.y = y.y
            return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
          })
          .call(addContent)
          .call(
            d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended)
          )
          .on("dblclick", dblclick);
      }
      function addLink(x) {
        return cont_links.append("line")
          .datum(x)
          .attr("stroke", function (d) {
            return isTest(d.target) || isTest(d.source) ? "darkgray" : "black"
          })
          .attr("stroke-width", "5px");
      }

      function dblclick(d) {
        _this.props.onSelection(d.value.position.start)
        PubSub.publish("CHANGE_DIFF_CONTEXT", { node: d })//, root: d.causes.length === 0 ? d : getRoot(d.causes[0]) })
      }

      // function getRoot(id) {
      //   const d = graph.byId[id];
      //   return d.causes.length === 0 ? d : getRoot(d.causes[0])
      // }

      // let labelNode = container.append("g").attr("class", "labelNodes")
      //     .selectAll("text")
      //     .data(label.nodes)
      //     .enter()
      //     .append("text")
      //     .text(function(d, i) { return i % 2 == 0 ? "" : d.node.id; })
      //     .style("fill", "#555")
      //     .style("font-family", "Arial")
      //     .style("font-size", 12)
      //     .style("pointer-events", "none"); // to prevent mouseover/drag capture

      // node.on("mouseover", focus).on("mouseout", unfocus);

      function ticked() {
        container.select(".nodes").selectAll("g") && container.selectAll(".nodes").selectAll("g").call(updateNode);
        container.selectAll(".links").selectAll("line") && container.selectAll(".links").selectAll("line").call(updateLink);
        container.selectAll(".labels") && container.selectAll(".labels").selectAll("text") && container.selectAll(".labels").selectAll("text").call(updateLinkText);
        if (!nodes && !links) {
          graphLayout.stop()
        }
        // labelLayout.alphaTarget(0.3).restart();
        // labelNode.each(function(d, i) {
        //     if(i % 2 == 0) {
        //         d.x = d.node.x;
        //         d.y = d.node.y;
        //     } else {
        //         let b = this.getBBox();

        //         let diffX = d.x - d.node.x;
        //         let diffY = d.y - d.node.y;

        //         let dist = Math.sqrt(diffX * diffX + diffY * diffY);

        //         let shiftX = b.width * (diffX - dist) / (dist * 2);
        //         shiftX = Math.max(-b.width, Math.min(0, shiftX));
        //         let shiftY = 16;
        //         this.setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
        //     }
        // });
        // labelNode.call(updateNode);

      }

      function fixna(x) {
        if (isFinite(x)) return x;
        return 0;
      }

      function focus(d) {
        const index = d3.select(d3.event.target).datum().index;
        nodes.style("opacity", function (o) {
          return neigh(index, o.index) ? 1 : 0.1;
        });
        // labelNode.attr("display", function(o) {
        //   return neigh(index, o.node.index) ? "block": "none";
        // });
        links.style("opacity", function (o) {
          return o.source.index == index || o.target.index == index ? 1 : 0.1;
        });
      }

      function unfocus() {
        //    labelNode.attr("display", "block");
        nodes.style("opacity", 1);
        links.style("opacity", 1);
      }

      function updateLink(link) {
        link.attr("x1", function (d) { return fixna(d.source.x); })
          .attr("y1", function (d) { return fixna(d.source.y); })
          .attr("x2", function (d) { return fixna(d.target.x); })
          .attr("y2", function (d) { return fixna(d.target.y); });
      }

      function updateLinkText(link) {
        link
          .attr("x", function (d) {
            return ((d.source.x + d.target.x) / 2);
          })
          .attr("y", function (d) {
            return ((d.source.y + d.target.y) / 2);
          });
      }

      function updateNode(node) {
        node.attr("transform", function (d) {
          return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
        });
      }

      function dragstarted(d) {
        d3.event.sourceEvent.stopPropagation();
        if (!d3.event.active) graphLayout.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }

      function dragended(d) {
        if (!d3.event.active) graphLayout.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      _this.refs.load.addEventListener('change', function () {
        var reader = new FileReader();
        reader.addEventListener("loadend", function () {
          // reader.result contains the contents of blob as a typed array
          console.log(reader.result)
          document.createElement("div").innerHTML = reader.result;
          document.createElement("div").dispatchEvent(new Event("input"));
        });
        reader.readAsText(this.files[0]);
      });
      _this.refs.export.addEventListener('click',
        function () {
          var svg_data = _this.refs.canvas.innerHTML //put id of your svg element here

          var head = '<svg title="graph" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'

          //if you have some additional styling like graph edges put them inside <style> tag

          var style = '<style>circle {cursor: pointer;stroke-width: 1.5px;}text {font: 10px arial;}path {stroke: DimGrey;stroke-width: 1.5px;}</style>'

          var full_svg = head + style + svg_data + "</svg>"

          var blob = new Blob([full_svg], { type: "image/svg+xml" });
          saveAs(blob, "ile.svg");
        })
    }
    run()
  }
  render() {
    return (
      <div style={{ height: "100%", width: "100%" }}>
        <div style={{ position: "fixed" }}>
          <button ref="load">load</button>
          <button ref="export">export</button>
        </div>
        <svg ref="canvas" style={{ height: "100%", width: "100%" }}></svg>
      </div>);
  }
}
export default GraphChart

