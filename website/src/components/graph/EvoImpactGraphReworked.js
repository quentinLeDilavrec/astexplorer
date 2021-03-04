import PropTypes from 'prop-types';
import React, { Component, StaticLifecycle } from 'react'
import * as d3 from 'd3'
import PubSub from 'pubsub-js';
import isequal from "lodash.isequal";

const ONLY_TESTS_DECLS = false;

export default class EvoImpactGraphReworked extends Component {

  constructor(props) {
    super(props);
    this.state = {
      uuid: props.uuid,
      graph: props.graph,
    };
  }

  componentDidMount() {
    this.reloadGraph(this.state.graph)
  }

  static getDerivedStateFromProps(props, state) {
    state.onScreenShot && props.onScreenShot(state.onScreenShot)
    if (props.uuid !== state.uuid) {
      return {
        uuid: props.uuid,
        graph: props.graph,
      };
    }
    return null;
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.uuid !== nextState.uuid) {
      return true;
    }
    if (this.state.graph.evolutions !== nextState.graph.evolutions) {
      return true;
    }
    if (this.state.graph.commitIdAfter !== nextState.graph.commitIdAfter) {
      return true;
    }
    if (this.state.graph.commitIdBefore !== nextState.graph.commitIdBefore) {
      return true;
    }
    return false
  }

  componentDidUpdate() {
    this.reloadGraph(this.state.graph)
  }

  reloadGraph(x, state = {}) {
    x = JSON.parse(JSON.stringify(x)) // following operation mutate x
    console.log("reloadGraph", x, JSON.stringify(x))

    function preprocess(x, state) {
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
                "value": {
                  "sig": {
                    "declType": "",
                    "signature": "",
                    "name": "",
                    "id": 111111111111
                  },
                  "position": {
                    "isTest": true,
                    "file": "",
                    "start": 1111111,
                    "end": 11111111,
                    "method": {
                      "declType": "",
                      "signature": "",
                      "name": "",
                      "id": 111111111111111
                    }
                  }
                },
                "causes": [],
                "effects": [],
                "isRoot": [],
                "depth": x.depth + 1,
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
        });
        data.nodes = Object.values(data.byId);
      }
      return data
    }
    function preprocess2(x, state) {
      const data = {
        ...state,
        nodes: [],
        links: [],
        roots: x.roots || [],
        tests: x.tests || [],
        byId: {}
      }
      const nodes = []
      // const nodes_more = {}
      const rangesMap = {}
      let count = 0;
      const wanted = x.ranges.findIndex(x => x.sig && x.sig === "create()")
      const computed = {}
      const next_wanted = {}
      const next_wanted_file = {}
      for (let i = 0; i < x.impacts.length; i++) {
        const iterator = x.impacts[i]
        // if (
        //   iterator.content.type !== "Change Return Type" 
        // // && iterator.content.type !== "Change Variable Type" 
        // // && iterator.content.type !== "Change Parameter Type"
        // ) {
        //   continue
        // }
        // if (count > 200) {
        //   break
        // } else count++
        if (iterator.causes.some(x => x === wanted) || iterator.effects.some(x => x === wanted)) {
          console.log(iterator)
        } else if (iterator.effects.some(y => x.ranges[y].file === "core/src/main/java/com/graphhopper/storage/GraphBuilder.java")) {
          console.log(iterator)
        } else continue
        computed[i] = i
        for (const cause of iterator.causes) {
          // if (typeof cause !== "number") {
          //   const aaa = nodes_more[JSON.stringify(cause)]
          //   if (aaa === undefined) {
          //     tmp_cause = nodes.length
          //     nodes.push(cause)
          //     nodes_more[JSON.stringify(cause)] = tmp_cause
          //   } else {
          //     tmp_cause = aaa
          //   }
          // } else {
          const element = x.ranges[cause]
          data.byId[cause] = { value: x.ranges[cause], id: cause, causes2: [], effects2: [] };
          rangesMap[element.file + ":" + element.start + "-" + element.end] = data.byId[cause]
          next_wanted[cause] = cause
          next_wanted_file[element.file] = element.file
          // }
          for (const effect of iterator.effects) {
            // let tmp_effect = effect
            // if (typeof effect !== "number") {
            //   const bbb = nodes_more[JSON.stringify(effect)]
            //   if (bbb === undefined) {
            //     tmp_effect = nodes.length
            //     nodes.push(effect)
            //     nodes_more[JSON.stringify(effect)] = tmp_effect
            //   } else {
            //     tmp_effect = bbb
            //   }
            // } else {
            const element = x.ranges[effect]
            data.byId[effect] = { value: element, id: effect, causes2: [], effects2: [] };
            rangesMap[element.file + ":" + element.start + "-" + element.end] = data.byId[effect]
            next_wanted_file[element.file] = element.file
            // }
            data.links.push({
              target: effect,
              source: cause,
              content: iterator.content,
              type: iterator.content.type,
            })
          }
        }
      }
      for (let index = 0; index < 1; index++) {
        for (let i = 0; i < x.impacts.length; i++) {
          const iterator = x.impacts[i]
          // if (
          //   iterator.content.type !== "Change Return Type" 
          // // && iterator.content.type !== "Change Variable Type" 
          // // && iterator.content.type !== "Change Parameter Type"
          // ) {
          //   continue
          // }
          // if (count > 200) {
          //   break
          // } else count++
          if (computed[i] === i && iterator.causes.some(x => next_wanted[x] === x) || iterator.effects.some(x => next_wanted[x] === x)) {
            console.log(iterator)
          } else if (computed[i] === i && iterator.causes.some(x => next_wanted_file[x.file] === x.file) || iterator.effects.some(x => next_wanted_file[x.file] === x.file)) {
            console.log(iterator)
          } else continue
          computed[i] = i
          for (const cause of iterator.causes) {
            // if (typeof cause !== "number") {
            //   const aaa = nodes_more[JSON.stringify(cause)]
            //   if (aaa === undefined) {
            //     tmp_cause = nodes.length
            //     nodes.push(cause)
            //     nodes_more[JSON.stringify(cause)] = tmp_cause
            //   } else {
            //     tmp_cause = aaa
            //   }
            // } else {
            const element = x.ranges[cause]
            data.byId[cause] = { value: x.ranges[cause], id: cause, causes2: [], effects2: [] };
            rangesMap[element.file + ":" + element.start + "-" + element.end] = data.byId[cause]
            next_wanted[cause] = cause
            next_wanted_file[element.file] = element.file
            // }
            for (const effect of iterator.effects) {
              // let tmp_effect = effect
              // if (typeof effect !== "number") {
              //   const bbb = nodes_more[JSON.stringify(effect)]
              //   if (bbb === undefined) {
              //     tmp_effect = nodes.length
              //     nodes.push(effect)
              //     nodes_more[JSON.stringify(effect)] = tmp_effect
              //   } else {
              //     tmp_effect = bbb
              //   }
              // } else {
              const element = x.ranges[effect]
              data.byId[effect] = { value: element, id: effect, causes2: [], effects2: [] };
              rangesMap[element.file + ":" + element.start + "-" + element.end] = data.byId[effect]
              next_wanted[effect] = effect
              next_wanted_file[element.file] = element.file
              // }
              data.links.push({
                target: effect,
                source: cause,
                content: iterator.content,
                type: iterator.content.type,
              })
            }
          }
        }
      }
      const roots = {}
      if (x.evolutions) {
        for (const evo of x.evolutions) {
          evo.before = evo.before
          evo.after = evo.after
          evo.commitIdAfter = x.commitIdAfter
          for (const element of evo.before) {
            if (element.file === "core/src/main/java/com/graphhopper/storage/GraphBuilder.java") {
              if (element.start === 3563 && element.end === 3575) {
                console.log(element)
              }
            }
            const key = element.file + ":" + element.start + "-" + element.end
            let rrr = rangesMap[key]
            if (rrr === undefined) {
              rrr = {
                file: element.file,
                start: element.start,
                end: element.end,
                id: nodes.length
              }
              rangesMap[key] = rrr
              // nodes.push(rrr)
              // data.byId[rrr.id] = rrr
            }
            evo.commitIdBefore = rrr.commitId || evo.commitIdBefore || x.commitIdBefore
            element.commitId = rrr.commitId || element.commitId || evo.commitIdBefore
            element.file = element.file
            if (rrr.evolutions===undefined || !(rrr.evolutions.length >= 0)) {
              rrr.evolutions = []
            }
            rrr.evolutions = [...rrr.evolutions, evo]
            rrr.isRoot = true
            if (roots[key] === undefined) {
              data.roots.push(rangesMap[key].id)
              roots[key] = true
            }
          }
          for (const element of evo.before) {
            element.commitId = element.commitId || x.commitIdAfter
            element.file = element.file
          }
        }
      }

      data.nodes = Object.values(data.byId)
      return data
    }
    let data
    try {
      data = preprocess2(x, state)
      return this.drawGraphChart(data);
    } catch (error) {
      console.error(error)
      data = preprocess(x, state)
    }
  }

  drawGraphChart(data, max_depth) {
    console.log(data, JSON.stringify(data))
    const _this = this;
    const _graph = data

    function run(graph = _graph) {
      _this.refs.canvas &&
        (_this.refs.canvas.innerHTML = '');

      function isTest(d) {
        return d.isTest || (d.value
          && ((d.value.isTest) || (d.value.position
            && d.value.position.isTest)))
      }

      var y = d3.scaleLinear()
        .domain([1, 30])
        .range([20, height / 5 - 20]);

      let width = graph.roots.length * 1000;
      let height = 600+graph.roots.length*100;

      let color = d3.scaleOrdinal(d3.schemeCategory10);

      const zetgzerfg = {}
      graph.roots.forEach((x, i) => zetgzerfg[x] = i)
      const graphLayout = d3.forceSimulation(graph.nodes)
        .force("charge", d3.forceManyBody().distanceMin(2000)
          .strength(d => isTest(d) ? (d.isTest ? -60 : -60) : -1000))
        // .force("y", d3.forceY(d => {
        //   if (isTest(d)) {
        //     return 300 * d.depth - 50
        //   }
        //   return 300 * d.depth
        // }).strength(d => isTest(d) ? .8 : 1.))
        // .force("x", d3.forceX(d => {
        //   return zetgzerfg[d.root] * 1000
        // }).strength(d => d.isRoot ? (1) : .2))
        .force("collide",
          d3.forceCollide().radius(NODE_SIZE*10).strength(.99).iterations(40)
          // d3.forceCollide()
          // .radius(d => (isTest(d) ? (d.isTest ? 10 : 10) : d.isRoot ? 20 :10) * NODE_SIZE*10)
          // .strength(d => isTest(d) ? (d.isTest ? 1 : 1) : 1)
          // .radius(NODE_SIZE*100).strength(1)
        )
        .force("link", d3.forceLink(graph.links)
          .id(function (d) { return d.id; })
          .distance(d=> {
            if (d.evolutions===undefined || d.evolutions.length===undefined || d.evolutions.length===0) {
              return 200
            }
            return isTest(d) ? 10 : 40
          }).strength(.5));


      const adjlist = [];

      graph.links.forEach(function (d) {
        adjlist[d.source.index + "-" + d.target.index] = true;
        adjlist[d.target.index + "-" + d.source.index] = true;
        (d.target.causes2 = d.target.causes2 || []).push(d);
        (d.source.effects2 = d.source.effects2 || []).push(d);
      });

      setTimeout(function () {
        graphLayout
        graphLayout.restart();
      }, 1000)
      setTimeout(function () {
        // graph.roots.forEach(element => {
        //   graphLayout.force("g" + element, null)
        // });
        graphLayout
          // .force("charge", d3.forceManyBody().distanceMin(1000)
          //   .strength(d => 5000))
          .force("charge", d3.forceManyBody().distanceMax(1000)
            .strength(d => -1000))
          .force("collide",
            d3.forceCollide().radius(d => {
              if (d.evolutions===undefined || d.evolutions.length===undefined || d.evolutions.length===0) {
                return NODE_SIZE * 2
              }
              return NODE_SIZE * 3
            }).strength(.85)
             )
          .force("link", d3.forceLink(graph.links)
            .id(function (d) { return d.id; })
            .distance(d => {
              if (d.evolutions===undefined || d.evolutions.length===undefined || d.evolutions.length===0) {
                return NODE_SIZE * 1.5
              }
              return NODE_SIZE * 2
            }).strength(.7))
        // .force("collision", d3.forceCollide(1)
        //   .radius(d => (isTest(d) ? (d.isTest ? 10 : 10) : d.isRoot ? 20 :10) * NODE_SIZE)
        //   .strength(d => isTest(d) ? (d.isTest ? 1 : 1) : .5)
        // )
        graphLayout.restart();
      }, 1000)

      graphLayout
        .on("tick", ticked)
        .alpha(3);

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

      const NODE_SIZE = 50

      const links = container.append("g").attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("stroke", function (d) {
          return isTest(d.target) || isTest(d.source) 
          ? (d.content && d.content.type==="call"?"orange":d.content && d.content.type==="adjustment"?"green":"darkgray")
          : (d.content && d.content.type==="call"?"red":d.content && d.content.type==="adjustment"?"darkgreen":"black")
        })
        .attr("stroke-width", "5px");

      links.call(myaddtitle);
      function myaddtitle(node) {
        node
          .append("svg:title")
          .text(function (d, i) {
          return d.content && d.content.type
          })
      }

      const nodes = container.append("g").attr("class", "nodes")
        .selectAll("g")
        .data(graph.nodes)
        .enter()
        .append("g")
        .style("transform-origin", "center");

      nodes.call(addContent);

      function addContent(/** @type {d3.Selection<SVGGElement, any, SVGGElement, any>} */node) {
        const evo_nodes = node
          .filter(d => {
            if (d.evolutions===undefined || d.evolutions.length===undefined || d.evolutions.length===0) {
              return false
            }
            return true
          })
        evo_nodes
          .append("text")
          .style("transform-origin", "center")
          .style("font-weight", 900)
          .style("font-size", "80px")
          .style("font-family", "sans-serif")
          .attr("fill", d => {
            return isTest(d) ? "orange" : "green"
          })
          .text(d => {
            return d.evolutions.map(x => {
              if (x.type === "Move Method") {
                return "MM"
              }
              try {
                return x.type.split(" ").map(x => x[0]).join("")
              } catch (error) {
                return "O"
              }
            }).join("-")
          })
          .attr("dominant-baseline", "middle")
          .attr("text-anchor", "middle")
          .append("svg:title")
          .text(function (d, i) {
            return "" + d.evolutions.map(x => x.type) + "\n" + (d.value && d.value.start) + "," + (d.value && d.value.end)
          })
        const other_nodes = node
          .filter(d => {
            if (d.evolutions===undefined || d.evolutions.length===undefined || d.evolutions.length===0) {
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
            const value = d.value || d
            if (typeof value === "string") {
              return value
            }
            if (typeof value.name === "string") {
              return value.name
            }
            if (typeof value.sig === "string") {
              return value.sig
            }
            return "" + value.start + "," + value.end
          })
          .append("svg:title")
          .text(function (d, i) {
            if (typeof d.signature === "string") {
              return d.declType + '.' + d.signature
            }
            const value = d.value || d
            if (typeof value === "string") {
              return value
            }
            if (typeof value.signature === "string") {
              return value.declType + '.' + value.signature
            }
            if (typeof value.sig === "string") {
              return value.sig + "\n" + value.start + "," + value.end
            }
            if (value.sig) {
              return value.sig.declType + '.' + value.sig.signature + "\n" + value.type
            }
            return "" + value.start + "," + value.end
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
            return "" + value.start + "," + value.end
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
              return value.sig + "\n" + value.start + "," + value.end
            }
            if (value.sig !== undefined) {
              return value.sig.declType + '.' + value.sig.signature
            }
            return "" + value.start + "," + value.end + "\n" + value.type
          });
      }

      // nodes.on("mouseover", focus).on("mouseout", unfocus);


      // TODO put labels (like type of impact of any other relation)
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
      //   return d.content && d.content.type
      //   // return d.count && d.count > 1 ? "" + d.count : "";
      // });

      nodes.call(
        d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

      nodes.on("dblclick", dblclick)

      function findRoot(node) {
        // TODO do not rely on d3 to move in the graph
        const r = []
        const stack = [node]
        while (stack.length > 0) {
          const curr = stack.pop()
          if (curr.isRoot) {
            r.push(curr)
          } else if (curr.value && curr.value.description === "given") {
            curr.value.commitId = curr.effects2[0].target.value.commitId
            r.push(curr)
          } else {
            stack.push(...(curr.causes2.map(x => x.source)));
          }
        }
        return r
      }

      function dblclick(d) {
        // TODO make it available to rest of app
        if (d.evolutions!==undefined && d.evolutions.length > 0) {
          _this.props.onSelection({
            filePath: d.value.file,
            commitId: d.value.commitId,
            start: d.value.start,
            end: d.value.end,
          })
        } else {
          _this.props.onSelection({
            filePath: d.value.file,
            commitId: findRoot(d)[0].commitId,
            start: d.value.start,
            end: d.value.end,
          })
        }
        PubSub.publish("CHANGE_DIFF_CONTEXT", { node: d })
      }

      function ticked() {
        container.select(".nodes").selectAll("g") && container.selectAll(".nodes").selectAll("g").call(updateNode);
        container.selectAll(".links").selectAll("line") && container.selectAll(".links").selectAll("line").call(updateLink);
        container.selectAll(".labels") && container.selectAll(".labels").selectAll("text") && container.selectAll(".labels").selectAll("text").call(updateLinkText);
        if (!nodes && !links) {
          graphLayout.stop()
        }

      }

      function fixna(x) {
        if (isFinite(x)) return x;
        return 0;
      }

      function focus(d) {
        const index = d3.select(d3.event.target).datum().index;
        nodes.style("opacity", function (o) {
          return neigh(index, o.index) ? 1 : 0.5;
        });
        links.style("opacity", function (o) {
          return o.source.index == index || o.target.index == index ? 1 : 0.5;
        });
      }

      function unfocus() {
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
      _this.state.onScreenShot = () => {
        var svg_data = _this.refs.canvas.innerHTML //put id of your svg element here

        var head = `<svg title="graph" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="${height}" width="${width}">`

        //if you have some additional styling like graph edges put them inside <style> tag

        var style = `<style>circle {cursor: pointer;stroke-width: 1.5px;}text {font: 10px arial;}path {stroke: DimGrey;stroke-width: 1.5px;}</style>`

        var full_svg = head + style + svg_data + "</svg>"
        _this.props.returnScreenShot(full_svg);
      }
      _this.props.onScreenShot(_this.state.onScreenShot)
    }
    run()
  }

  render() {
    return (
      <div style={{ height: "100%", width: "100%" }}>
        <svg ref="canvas" style={{ height: "100%", width: "100%" }}></svg>
      </div>);
  }

}

EvoImpactGraphReworked.propTypes = {
  graph: PropTypes.object,
  position: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  uuid: PropTypes.string,
  onSelection: PropTypes.func,
  returnScreenShot: PropTypes.func,
  onScreenShot: PropTypes.func,
};
