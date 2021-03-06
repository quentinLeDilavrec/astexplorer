import PropTypes from "prop-types";
import React, { Component, StaticLifecycle } from "react";
import * as d3 from "d3";
import PubSub from "pubsub-js";
import isequal from "lodash.isequal";
import { GraphP } from "../GraphOutput";
import { File, Range } from "../MultiEditor2";

const ONLY_TESTS_DECLS = false;

type S = {
  uuid: GraphP["uuid"];
  graph: GraphP["graph"];
};

type Unstack<T> = T extends Array<infer U> ? U : never;

type Node<T> = {
  value: T;
  id: number;
  index?: number;
  isRoot?: boolean;
  evolutions?: any[];
};

type ById<T> = {
  [id: string]: T;
};

function preprocess(x: NonNullable<GraphP["graph"]>, state: any = {}) {
  const ranges = x.ranges;
  const impacts = x.impacts;
  type intNode = Node<Unstack<typeof ranges>> & {
    causes2: any[];
    effects2: any[];
  };
  type intLink = {
    target: any;
    source: any;
    content?: any;
    type?: any;
  };
  let NodesCount = x.ranges.length;
  let data = {
    files: [] as (Node<File> & { isTestFile?: boolean })[],
    fileLinks: [] as {
      target: any;
      source: any;
    }[],
    nodes: [] as intNode[],
    links: [] as intLink[],
    roots: x["roots"] || ([] as any[]),
    tests: x["tests"] || ([] as any[]),
    byId: {} as ById<intNode>,
  };
  data = { ...state, ...data };
  const rangesMapBefore: ById<intNode> = {};
  const rangesMapAfter: ById<intNode> = {};
  for (let i = 0; i < impacts.length; i++) {
    const iterator = impacts[i];
    if (!iterator) {
      continue;
    }
    for (const cause of iterator.causes) {
      const element = ranges[cause];
      if (!element) {
        console.error(cause + " not in ranges");
        continue;
      }
      const tmp = {
        value: element,
        id: cause,
        causes2: [] as any[],
        effects2: [] as any[],
      };
      data.byId[cause] = tmp;
      rangesMapBefore[
        element.file + ":" + element.start + "-" + element.end
      ] = tmp;
      for (const effect of iterator.effects) {
        const element = ranges[effect];
        if (!element) {
          console.error(effect + " not in ranges");
          continue;
        }
        const tmp = {
          value: element,
          id: effect,
          causes2: [],
          effects2: [],
        };
        data.byId[effect] = tmp;
        rangesMapBefore[
          element.file + ":" + element.start + "-" + element.end
        ] = tmp;
        data.links.push({
          target: effect,
          source: cause,
          content: iterator.content,
          type: iterator.content.type,
        });
      }
    }
  }
  for (let index = 0; index < 1; index++) {
    for (let i = 0; i < impacts.length; i++) {
      const iterator = impacts[i];
      if (!iterator) {
        continue;
      }
      for (const cause of iterator.causes) {
        const element = ranges[cause];
        if (!element) {
          console.error(cause + " not in ranges");
          continue;
        }
        const tmp = {
          value: element,
          id: cause,
          causes2: [],
          effects2: [],
        };
        data.byId[cause] = tmp;
        rangesMapBefore[
          element.file + ":" + element.start + "-" + element.end
        ] = tmp;
        for (const effect of iterator.effects) {
          const element = ranges[effect];
          if (!element) {
            console.error(effect + " not in ranges");
            continue;
          }
          const tmp = {
            value: element,
            id: effect,
            causes2: [],
            effects2: [],
          };
          data.byId[effect] = tmp;
          rangesMapBefore[
            element.file + ":" + element.start + "-" + element.end
          ] = tmp;
          data.links.push({
            target: effect,
            source: cause,
            content: iterator.content,
            type: iterator.content.type,
          });
        }
      }
    }
  }
  const roots = {};
  if (x.evolutions) {
    for (let evo of x.evolutions) {
      evo.commitIdBefore = evo.commitIdBefore || x.commitIdBefore;
      evo.commitIdAfter = evo.commitIdAfter || x.commitIdAfter;
      for (const element of evo.before) {
        const key = element.file + ":" + element.start + "-" + element.end;
        element.commitId = element.commitId || x.commitIdBefore;
        let rangeInMap = rangesMapBefore[key];
        if (!rangeInMap) {
          rangeInMap = {
            value: element,
            id: NodesCount,
            causes2: [],
            effects2: [],
          };
          data.byId[NodesCount] = rangeInMap;
          NodesCount++;
          rangesMapBefore[key] = rangeInMap;
        }
        evo.commitIdBefore =
          evo.commitIdBefore || rangeInMap.value.commitId || x.commitIdBefore;
        element.commitId =
          element.commitId || rangeInMap.value.commitId || evo.commitIdBefore;
        element.file = element.file;
        if (
          rangeInMap.evolutions === undefined ||
          !(rangeInMap.evolutions.length >= 0)
        ) {
          rangeInMap.evolutions = [];
        }
        rangeInMap.evolutions = [...rangeInMap.evolutions, evo];
        rangeInMap.isRoot = true;
        if (roots[key] === undefined) {
          const tmp = rangesMapBefore[key];
          if (tmp) {
            data.roots.push(tmp.id);
            roots[key] = true;
          }
        }
      }
      // for (const element of evo.after) {
      //   const key = element.file + ":" + element.start + "-" + element.end;
      //   element.commitId = element.commitId || x.commitIdAfter;
      //   let rangeInMap = rangesMapAfter[key];
      //   if (!rangeInMap) {
      //     rangeInMap = {
      //       value: element,
      //       id: nodes.length,
      //       causes2: [],
      //       effects2: [],
      //     };
      //     rangesMapAfter[key] = rangeInMap;
      //   }
      //   evo.commitIdAfter =
      //     rangeInMap.value.commitId || evo.commitIdAfter || x.commitIdAfter;
      //   element.commitId =
      //     rangeInMap.value.commitId || element.commitId || evo.commitIdAfter;
      //   element.file = element.file;
      //   if (rangeInMap.evolutions === undefined || !(rangeInMap.evolutions.length >= 0)) {
      //     rangeInMap.evolutions = [];
      //   }
      //   rangeInMap.evolutions = [...rangeInMap.evolutions, evo];
      //   rangeInMap.isRoot = true;
      //   if (roots[key] === undefined) {
      //     const tmp = rangesMapBefore[key];
      //     if (tmp) {
      //       data.roots.push(tmp.id);
      //       roots[key] = true;
      //     }
      //   }
      // }
    }
  }
  data.nodes = Object.values(data.byId);

  const files = {} as {
    [k: string]: { value: File; id: number; isTestFile?: boolean };
  };
  data.nodes.forEach(({ value: x, id }) => {
    debugger;
    const key = x.repository + "/" + x.commitId + "/" + x.file;
    let file = files[key];
    let fileId: number;
    if (file) {
      fileId = file.id;
      if (file.isTestFile === undefined) {
        file.isTestFile = x["isInTestCu"];
      } else if (
        file.isTestFile !== undefined &&
        x["isInTestCu"] !== undefined &&
        file.isTestFile !== x["isInTestCu"]
      ) {
        console.error("wrong file isTest value");
      }
    } else {
      file = {
        value: {
          repository: x.repository,
          commitId: x.commitId,
          file: x.file,
        },
        id: NodesCount,
        isTestFile: x["isInTestCu"],
      };
      files[key] = file;
      fileId = NodesCount;
      data.files.push(file);
      NodesCount++;
    }

    data.fileLinks.push({
      target: fileId,
      source: id,
    });
  });
  return data;
}

export default class EvoImpactGraphReworked extends Component<GraphP, S> {
  canvasRef: React.RefObject<SVGSVGElement>;
  constructor(props) {
    super(props);
    this.state = {
      uuid: props.uuid,
      graph: props.graph,
    };
    this.drawGraphChart.bind(this);
    this.canvasRef = React.createRef<any>();
  }

  componentDidMount() {
    this.reloadGraph(this.state.graph);
  }

  static getDerivedStateFromProps(props, state) {
    state.onScreenShot && props.onScreenShot(state.onScreenShot);
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
    if (!this.state.graph) {
      return false;
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
    return false;
  }

  componentDidUpdate() {
    this.reloadGraph(this.state.graph);
  }

  reloadGraph(x: GraphP["graph"], state = {}) {
    if (!x) {
      throw null;
    }
    const y: NonNullable<typeof x> = JSON.parse(
      JSON.stringify({
        ...x,
        evolutions: x.evolutions.map((x) => x.original || x),
      })
    ); // following operation mutate x
    console.log("reloadGraph", x, JSON.stringify(x));
    try {
      const data = preprocess(y, state);
      return this.drawGraphChart(data);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  drawGraphChart(data: ReturnType<typeof preprocess>, max_depth = undefined) {
    const FIX_AFTER_DRAG = true;
    console.log(data, JSON.stringify(data));
    const _this = this;
    const _graph = data;

    function run(graph = _graph) {
      _this.canvasRef.current && (_this.canvasRef.current.innerHTML = "");
      // _this.refs.canvas && (_this.refs.canvas.innerHTML = "");

      function isTest(d) {
        return (
          d.isTest ||
          (d.value &&
            (d.value.isTest || (d.value.position && d.value.position.isTest)))
        );
      }

      const width =
        _this.canvasRef.current?.getBBox().width || graph.roots.length * 1000;
      const height =
        _this.canvasRef.current?.getBBox().height ||
        600 + graph.roots.length * 100;

      const y = d3
        .scaleLinear()
        .domain([1, 30])
        .range([20, height / 5 - 20]);

      const color = d3.scaleOrdinal(d3.schemeCategory10);
      const allNodes = [...graph.nodes, ...graph.files];
      const allLinks = [...graph.links, ...graph.fileLinks];
      const NODE_SIZE = 50;
      type SymNode = Unstack<typeof graph.nodes> | Unstack<typeof graph.files>;
      const zetgzerfg = {};
      graph.roots.forEach((x, i) => (zetgzerfg[x] = i));
      const graphLayout = d3
        .forceSimulation(allNodes)
        .force(
          "charge",
          d3
            .forceManyBody<SymNode>()
            .distanceMin(3000)
            .strength((d) => 5000) //(isTest(d) ? (d.value.isTest ? 60 : 60) : 1000))
        )
        // .force("y", d3.forceY(d => {
        //   if (isTest(d)) {
        //     return 300 * d.depth - 50
        //   }
        //   return 300 * d.depth
        // }).strength(d => isTest(d) ? .8 : 1.))
        // .force("x", d3.forceX(d => {
        //   return zetgzerfg[d.root] * 1000
        // }).strength(d => d.isRoot ? (1) : .2))
        .force(
          "collide",
          d3
            .forceCollide<SymNode>()
            .radius(NODE_SIZE * 10)
            .strength(0.99)
            .iterations(40)
          // d3.forceCollide()
          // .radius(d => (isTest(d) ? (d.isTest ? 10 : 10) : d.isRoot ? 20 :10) * NODE_SIZE*10)
          // .strength(d => isTest(d) ? (d.isTest ? 1 : 1) : 1)
          // .radius(NODE_SIZE*100).strength(1)
        )
        .force(
          "link",
          d3
            .forceLink<SymNode, any>(allLinks)
            .id((d) => {
              return "" + d.id;
            })
            .distance((d) => {
              if (
                d.evolutions === undefined ||
                d.evolutions.length === undefined ||
                d.evolutions.length === 0
              ) {
                return 200;
              }
              return isTest(d) ? 10 : 40;
            })
            .strength(0.5)
        )
        .force("centering", d3.forceCenter(0, 0)); //width / 2, height / 2));

      const adjlist = [];

      graph.links.forEach(function(d) {
        adjlist[d.source.index + "-" + d.target.index] = true;
        adjlist[d.target.index + "-" + d.source.index] = true;
        (d.target.causes2 = d.target.causes2 || []).push(d);
        (d.source.effects2 = d.source.effects2 || []).push(d);
      });

      setTimeout(function() {
        graphLayout
          // .force("charge", d3.forceManyBody().distanceMin(1000)
          //   .strength(d => 5000))
          .force(
            "charge",
            d3
              .forceManyBody()
              .distanceMin(3000)
              .strength((d) => 5000)
          )
          .force(
            "charge2",
            d3
              .forceManyBody()
              .distanceMax(3000)
              .strength((d) => -1000)
          )
          .force(
            "collide",
            d3
              .forceCollide<SymNode>()
              .radius((d) => {
                if (
                  d.evolutions === undefined ||
                  d.evolutions.length === undefined ||
                  d.evolutions.length === 0
                ) {
                  return NODE_SIZE * 2;
                }
                return NODE_SIZE * 3;
              })
              .strength(0.85)
          )
          .force(
            "link",
            d3
              .forceLink<SymNode, any>(allLinks)
              .id((d) => {
                return "" + d.id;
              })
              .distance((d) => {
                if (
                  d.evolutions === undefined ||
                  d.evolutions.length === undefined ||
                  d.evolutions.length === 0
                ) {
                  return NODE_SIZE * 1.2;
                }
                return NODE_SIZE * 1.7;
              })
              .strength((d) => ("start" in d.target.value ? 0.95 : 0.5))
          )
          .force("centering", d3.forceCenter(width / 2, height / 2));
        graphLayout.restart();
        svg.call(
          zoom.transform,
          d3.zoomIdentity.translate(-1850, 0).scale(0.1)
        );
      }, 1000);

      graphLayout.on("tick", ticked).alpha(3);

      function neigh(a, b) {
        return a == b || adjlist[a + "-" + b];
      }
      if (!_this.canvasRef.current) {
        return null;
      }
      const svg = d3.select(_this.canvasRef.current);
      // .attr("viewBox",`0 0 ${width} ${height}`)
      // .attr("width", width)
      // .attr("height", height);
      const container = svg.append("g");

      const zoom = d3
        .zoom()
        .scaleExtent([0.01, 4])
        .on("zoom", function(a, b, c) {
          container.attr("transform", d3.event.transform);
        });
      svg.call(zoom);
      // svg.call(zoom.transform, d3.zoomIdentity.translate(-width,0));
      svg.call(zoom.transform, d3.zoomIdentity.scale(0.01));
      // svg.call(zoom.transform, d3.zoomIdentity.translate(-width,0));

      svg
        .transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.scale(0.2));

      let defs = svg.append("defs");

      let filter = defs
        .append("filter")
        .attr("x", "-.03")
        .attr("y", "-.1")
        .attr("width", "1.06")
        .attr("height", "1.2")
        .attr("id", "background"); // id of the filter
      filter.append("feFlood").attr("flood-color", "black");
      filter.append("feComposite").attr("in", "SourceGraphic");

      const FILE_COLOR = (x: Unstack<typeof graph.files>) =>
        x.isTestFile === undefined
          ? "lightgray"
          : x.isTestFile
          ? "wheat"
          : "powderblue";

      const fileLinks = container
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.fileLinks)
        .enter()
        .append("line")
        .attr("stroke", (d) => FILE_COLOR(d.target))
        .attr("stroke-width", "40px");

      const files = container
        .append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(graph.files)
        .enter()
        .append("g")
        .style("transform-origin", "center");
      files
        .append("circle")
        .attr("r", NODE_SIZE)
        .attr("fill", FILE_COLOR)
        .append("svg:title")
        .text((d) => d.value.file);

      function extractAstPath(x) {
        // const tmp = /#([^[]+)\[([^\]]+)\]/.exec(x)
        // if (!tmp) {
        //   return [x]
        // }
        // const match = tmp[0]
        // if (!match) {
        //   return [x]
        // }
        // const rec = extractAstPath(x.substr(match.length-1))
        // return [[tmp[1],tmp[2]],...rec]
        x.split("#")
          .slice(1)
          .map((x) => {
            const tmp = /([^[#]+)\[([^=]+)=([^\]]+)\]/.exec(x);
            return tmp
              ? { type: tmp[1], props: { ["" + tmp[2]]: tmp[3] } }
              : { type: x };
          });
      }

      const links = container
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("stroke", function(d) {
          return isTest(d.target) || isTest(d.source)
            ? d.content && d.content.type === "call"
              ? "orange"
              : d.content && d.content.type === "adjustment"
              ? "green"
              : "darkgray"
            : d.content && d.content.type === "call"
            ? "red"
            : d.content && d.content.type === "adjustment"
            ? "darkgreen"
            : "black";
        })
        .attr("stroke-width", "5px");

      links.call(myaddtitle);
      function myaddtitle(node: typeof links) {
        node.append("svg:title").text(function(d, i) {
          return d.content && d.content.type;
        });
      }
      const nodesContainer = container.append("g").attr("class", "nodes");

      const nodes = nodesContainer
        .selectAll("g")
        .data(graph.nodes)
        .enter()
        .append("g")
        .style("transform-origin", "center");

      nodes.call(addContent);
      function addContent(node: typeof nodes) {
        const evo_nodes = node.filter((d) => {
          if (
            d.evolutions === undefined ||
            d.evolutions.length === undefined ||
            d.evolutions.length === 0
          ) {
            return false;
          }
          return true;
        });
        evo_nodes
          .append("text")
          .style("transform-origin", "center")
          .style("font-weight", 900)
          .style("font-size", "80px")
          .style("font-family", "sans-serif")
          .attr("fill", (d) => {
            return isTest(d) ? "orange" : "green";
          })
          .text((d) => {
            return (
              d.evolutions
                ?.map((x) => {
                  if (x.type === "Move Method") {
                    return "MM";
                  }
                  try {
                    return x.type
                      .split(" ")
                      .map((x) => x[0])
                      .join("");
                  } catch (error) {
                    return "O";
                  }
                })
                ?.join("-") || "O"
            );
          })
          .attr("dominant-baseline", "middle")
          .attr("text-anchor", "middle")
          .append("svg:title")
          .text(function(d) {
            if ("start" in d.value) {
              return (
                "" +
                (d.evolutions?.map((x) => x.type) || "") +
                "\n" +
                (d.value && d.value.start) +
                "," +
                (d.value && d.value.end)
              );
            } else {
              return "";
            }
          });
        const other_nodes = node.filter((d) => {
          if (
            d.evolutions === undefined ||
            d.evolutions.length === undefined ||
            d.evolutions.length === 0
          ) {
            return true;
          }
          return false;
        });
        other_nodes
          .append("circle")
          // .attr("x", function (d) { return -NODE_SIZE * (d.scale || 1) / 2; })
          // .attr("y", function (d) { return -NODE_SIZE * (d.scale || 1) / 2; })
          .attr("r", function(d) {
            if (d.value.type === "Method") {
              return NODE_SIZE;
            } else if (d.value.type === "Constructor") {
              return NODE_SIZE / 1.5;
            }
            return NODE_SIZE / 2;
          })
          .attr("fill", "black");
        evo_nodes
          .append("text")
          .style("transform-origin", "center")
          .attr("dominant-baseline", "middle")
          .style("font-weight", "bolder")
          .attr("text-anchor", "middle")
          .attr("fill", "black")
          .text((d) => {
            if (typeof d["name"] === "string") {
              return d["name"];
            }
            const value = d.value || d;
            if (typeof value === "string") {
              return value;
            }
            if (typeof value["name"] === "string") {
              return value["name"];
            }
            if ("start" in value) {
              if (typeof value.sig === "string") {
                return value.sig;
              }
              return "" + value.start + "," + value.end;
            }
            return "a";
          })
          .append("svg:title")
          .text(function(d, i) {
            if (typeof d["signature"] === "string") {
              return d["declType"] + "." + d["signature"];
            }
            const value = d.value || d;
            if (typeof value === "string") {
              return value;
            }
            if (typeof value["signature"] === "string") {
              return value["declType"] + "." + value["signature"];
            }
            if ("start" in value) {
              if (typeof value.sig === "string") {
                return value.sig + "\n" + value.start + "," + value.end;
              }
              if (value.sig) {
                return (
                  value.sig["declType"] +
                  "." +
                  value.sig["signature"] +
                  "\n" +
                  value.type
                );
              }
              return "" + value.start + "," + value.end + "\n" + value.type;
            }
            return "b";
          });

        other_nodes
          .append("text")
          .style("transform-origin", "center")
          .attr("fill", (d) => {
            if (!("start" in d.value)) {
              return "gray";
            }
            if (d["isTest"]) {
              return "red";
            } else if (isTest(d)) {
              return "orange";
            } else if (d.isRoot) {
              return "green";
              // } else if (data.roots.includes(d.originalId)) {
              //   return "green"
              // } else if (d.depth === 1) {
              //   return "green"
              // } else if (d.root === d.originalId ) {
              //   return "green"
              // } else if (d.causes.length === 0) {
              //   return "green"
            }
            return "white";
          })
          .text((d) => {
            if (typeof d["name"] === "string") {
              return d["name"];
            }
            const value = d.value;
            if (typeof value === "string") {
              return value;
            }
            if (typeof value["name"] === "string") {
              return value["name"];
            }
            if ("start" in value) {
              if (typeof value.sig === "string") {
                return value.sig;
              }
              return "" + value.start + "," + value.end;
            }
            return "";
          })
          .attr("dominant-baseline", "middle")
          .attr("text-anchor", "middle")
          .attr("filter", (d) =>
            "start" in d.value ? "url(#background)" : null
          )
          .append("svg:title")
          .text(function(d, i) {
            if (typeof d["signature"] === "string") {
              return d["declType"] + "." + d["signature"];
            }
            const value = d.value;
            if (typeof value === "string") {
              return value;
            }
            if (typeof value["signature"] === "string") {
              return value["declType"] + "." + value["signature"];
            }
            if ("start" in value) {
              if (typeof value.sig === "string") {
                return value.sig + "\n" + value.start + "," + value.end;
              }
              if (value.sig !== undefined) {
                return value.sig["declType"] + "." + value.sig["signature"];
              }
              return "" + value.start + "," + value.end + "\n" + value.type;
            }
            return "";
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
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

      files.call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

      nodes.on("dblclick", dblclick);
      nodes.on("mouseover.highlight", (d) => {
        // PubSub.publish('HIGHLIGHT_DIFF', { node: {side:'left'}, range: [d.value.start, d.value.end] });
        if ("start" in d.value) {
          PubSub.publish("HIGHLIGHT", {
            node: { ...d.value, side: "left" },
            range: [d.value.start, d.value.end],
          });
        }
      });
      nodes.on("mouseleave.highlight", (d) => {
        // PubSub.publish('CLEAR_HIGHLIGHT_DIFF', { node: {side:'left'}, range: [d.value.start, d.value.end] });
        if ("start" in d.value) {
          PubSub.publish("CLEAR_HIGHLIGHT", {
            node: { ...d.value, side: "left" },
            range: [d.value.start, d.value.end],
          });
        }
      });

      function findRoot(node: Unstack<typeof graph.nodes>) {
        // TODO do not rely on d3 to move in the graph
        if (!node) {
          return [];
        }
        const r = [] as any[];
        const stack = [node];
        while (stack.length > 0) {
          const curr = stack.pop();
          if (!curr) {
            continue;
          } else if (curr.isRoot) {
            r.push(curr);
          } else if (curr.value && curr.value["description"] === "given") {
            curr.value.commitId = curr.effects2[0].target.value.commitId;
            r.push(curr);
          } else {
            stack.push(...curr.causes2.map((x) => x.source));
          }
        }
        return r;
      }

      function serializeRange(r: Range) {
        return `${r.repository}/commit/${r.commitId}/${r.file}:${r.start}:${r.end}`;
      }
      const Max_ImpactR = 5;
      const Max_Evolutions = 6;

      function dblclick(d: Unstack<typeof graph.nodes>) {
        const isEvolved = d.evolutions && d.evolutions.length > 0;
        if (!("start" in d.value)) {
          return;
        }
        const a = d.value;
        _this.props.onSelection({
          impactedRanges: {},
          selectedEvolutionIds: [],
          cursor: d.value,
        });

        const alreadySelectedEvoIds = _this.props.getSelectedEvolutionsIds();
        const alreadySelectedImpactedR = _this.props.getSelectedImpactedRanges();
        const impactedRanges: { [k: string]: Range } = {},
          selectedEvolutionIds = new Set() as Set<number>;
        let visited: { [k: string]: Range } = {};
        const eCount = alreadySelectedEvoIds.reduce(
          (acc, x) => acc + (x ? 1 : 0),
          0
        );
        const iCount = Object.keys(alreadySelectedImpactedR).length;

        function searchEffects(d: Unstack<typeof graph.nodes>) {
          const key = serializeRange(d.value);
          if (key in visited) {
            return;
          }
          visited[key] = d.value;
          if (isTest(d) && iCount < Max_ImpactR) {
            impactedRanges[key] = d.value;
          }
          d.evolutions?.forEach(
            (x) => eCount < Max_Evolutions && selectedEvolutionIds.add(x.id)
          );
          d.effects2.forEach((x) => {
            searchEffects(x.target);
          });
        }

        function searchCauses(d: Unstack<typeof graph.nodes>) {
          const key = serializeRange(d.value);
          if (key in visited) {
            return;
          }
          visited[key] = d.value;
          d.evolutions?.forEach(
            (x) => eCount < Max_Evolutions && selectedEvolutionIds.add(x.id)
          );
          d.causes2.forEach((x) => {
            searchCauses(x.source);
          });
        }

        if (eCount > 0) {
          if (d.evolutions?.every((x) => alreadySelectedEvoIds[x.id])) {
            // just search missing impacts
            searchEffects(d);
          } else if (d.evolutions?.some((x) => alreadySelectedEvoIds[x.id])) {
            searchEffects(d);
            visited = {};
            searchCauses(d);
          } else {
            // just highlight range
          }
        } else if (isEvolved && isTest(d)) {
          searchCauses(d);
        } else if (isEvolved) {
          searchEffects(d);
          visited = {};
          searchCauses(d);
        } else if (isTest(d)) {
          // only one impacted test here but multiple ranges possibly shown
          searchEffects(d);
          visited = {};
          searchCauses(d);
        } else {
          searchEffects(d);
          visited = {};
          searchCauses(d);
        }

        _this.props.onSelection({
          impactedRanges,
          selectedEvolutionIds: Array.from(selectedEvolutionIds),
          cursor: a,
        });

        // // TODO make it available to rest of app
        // if (d.evolutions !== undefined && d.evolutions.length > 0) {
        //   _this.props.onSelection({
        //     filePath: d.value.file,
        //     commitId: d.value.commitId,
        //     start: d.value.start,
        //     end: d.value.end,
        //   });
        // } else {
        //   _this.props.onSelection({
        //     filePath: d.value.file,
        //     commitId: findRoot(d)[0].commitId,
        //     start: d.value.start,
        //     end: d.value.end,
        //   });
        // }
        PubSub.publish("CHANGE_DIFF_CONTEXT", { node: d });
      }

      function ticked() {
        container.selectAll(".nodes").selectAll("g") &&
          container
            .selectAll(".nodes")
            .selectAll("g")
            .call(updateNode);
        container.selectAll(".links").selectAll("line") &&
          container
            .selectAll(".links")
            .selectAll("line")
            .call(updateLink);
        container.selectAll(".labels") &&
          container.selectAll(".labels").selectAll("text") &&
          container
            .selectAll(".labels")
            .selectAll("text")
            .call(updateLinkText);
        if (!nodes && !links) {
          graphLayout.stop();
        }
      }

      function fixna(x) {
        if (isFinite(x)) return x; // Math.max(600, Math.min(0, x));
        return 0;
      }

      function focus(d) {
        const index = d3.select<any, any>(d3.event.target).datum().index;
        nodes.style("opacity", function(o) {
          return neigh(index, o.index) ? 1 : 0.5;
        });
        links.style("opacity", function(o) {
          return o.source.index == index || o.target.index == index ? 1 : 0.5;
        });
      }

      function unfocus() {
        nodes.style("opacity", 1);
        links.style("opacity", 1);
      }

      function updateLink(link) {
        link
          .attr("x1", function(d) {
            return fixna(d.source.x);
          })
          .attr("y1", function(d) {
            return fixna(d.source.y);
          })
          .attr("x2", function(d) {
            return fixna(d.target.x);
          })
          .attr("y2", function(d) {
            return fixna(d.target.y);
          });
      }

      function updateLinkText(link) {
        link
          .attr("x", function(d) {
            return (d.source.x + d.target.x) / 2;
          })
          .attr("y", function(d) {
            return (d.source.y + d.target.y) / 2;
          });
      }

      function updateNode(node) {
        node.attr("transform", function(d) {
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
        if (FIX_AFTER_DRAG) {
          d.fx = d3.event.x;
          d.fy = d3.event.y;
        } else {
        }
      }
      const screenShotHandler = () => {
        if (!_this.canvasRef.current) {
          return null;
        }
        var svg_data = _this.canvasRef.current.innerHTML; //put id of your svg element here

        var head = `<svg title="graph" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="${height}" width="${width}">`;

        //if you have some additional styling like graph edges put them inside <style> tag

        var style = `<style>circle {cursor: pointer;stroke-width: 1.5px;}text {font: 10px arial;}path {stroke: DimGrey;stroke-width: 1.5px;}</style>`;

        var full_svg = head + style + svg_data + "</svg>";
        _this.props.returnScreenShot(full_svg);
      };
      _this.props.setScreenShotHandler(screenShotHandler);

      const reCenteringHandler = () => {
        const box = nodesContainer.node()?.getBBox();
        const svgNode = svg.node();
        const svgbox = svg.node()?.getBBox();
        if (!box || !svgbox || !svgNode) {
          return null;
        }
        const scale = Math.min(
          svgbox.width / box.width,
          svgbox.height / box.height
        ); // * 0.9;

        // Reset transform.
        let transform = d3.zoomIdentity;
        // Center [0, 0].
        // transform = transform.translate(svgbox.width / 2, svgbox.height / 2);
        // // Apply scale.
        transform = transform.scale(scale);
        // Center elements.
        // transform = transform.translate(
        //   -box.x - box.width / 2,
        //   -box.y - box.height / 2
        // );
        // transform = transform.translate(svgbox.width/2,svgbox.height/2)
        // transform = transform.translate(box.width/2,box.height/2)
        // transform = transform.translate(-box.x+svgbox.x,0)
        //   transform = transform.translate(
        //   -box.x + svgbox.x + svgbox.width / 2,
        //   -box.y + svgbox.y + svgbox.height / 2,
        // )
        // container.transition().call(zoom.transform,transform)
        // svg.call(zoomer,d3.zoomIdentity)
        // container.attr("transform", transform.toString());
        // console.log(svgbox, box, transform)
        console.log(
          svgNode.getBBox().width,
          svgNode.width.baseVal.value,
          svgNode.getBoundingClientRect().width,
          svgNode.clientWidth
        );
        console.log(
          nodesContainer.node()?.getBBox().width,
          nodesContainer.node()?.getBoundingClientRect().width,
          nodesContainer.node()?.clientWidth
        );
        // svg
        // // .attr("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`)
        // //   .call(zoom)
        // .transition()
        // .duration(750)
        // .call(zoom.transform, transform);
      };
      _this.props.setReCenteringHandler(reCenteringHandler);
    }
    run();
  }

  render() {
    return (
      <div style={{ height: "100%", width: "100%" }}>
        <svg
          preserveAspectRatio="xMidYMid meet"
          ref={this.canvasRef}
          style={{ height: "100%", width: "100%" }}
        ></svg>
      </div>
    );
  }

  static propTypes = {
    graph: PropTypes.object,
    position: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
    uuid: PropTypes.string,
    onSelection: PropTypes.func,
    returnScreenShot: PropTypes.func,
    onScreenShot: PropTypes.func,
  };
}
