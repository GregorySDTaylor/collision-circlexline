const BACKGROUND = "white"
const TEXT = "blue"
const CIRCLE_A = "blue"
const LINE_B = "green"
const COLLISION_FALSE = "rgba(0,0,0,0.5)"
const COLLISION_TRUE = "rgba(255,0,0,0.5)"
const KEYS = {"space": 32}
var paused = false

class Demo {
  constructor(canvas) {
    this.ctx = canvas.getContext("2d", { alpha: false })
    this.keyboarder = new Keyboarder()
    this.collision_objects = []
    this.setup()
    this.run()
  }
  
  setup(){
    this.keyboarder.on_press(KEYS.space, this.toggle_pause)
    this.update_window()
    
    this.circle_a = new CollisionCircle(
      this,
      Math.min(this.size.x, this.size.y)/5,
      {x: this.size.x/2, y:this.size.y/2},
      {x: this.size.x/300, y:this.size.y/500},
      0,
      0,
      CIRCLE_A,
      "A"
    )
    
    this.line_b = new CollisionLineSegment(
      this,
      Math.min(this.size.x, this.size.y)/1.6,
      {x: this.size.x/2, y:this.size.y/2},
      {x: this.size.x/-400, y:this.size.y/300},
      0,
      0.01,
      LINE_B,
      "B",
      "C"
    )
    
    this.collision_visualization = new CollisionVisualization(this)
  }
  
  run(){
    if (!paused) {
      this.update()}
    this.draw()
    requestAnimationFrame(this.run.bind(this))
  }
  
  update(){
    this.update_window()
    this.collision_objects.forEach( object => object.update())
    this.collision_visualization.update()
  }
  
  draw(){
    this.ctx.fillStyle = BACKGROUND
    this.ctx.fillRect(0, 0, this.size.x, this.size.y)
    this.collision_objects.forEach( object => object.draw())
    this.collision_visualization.draw()
  }
  
  update_window() {
    this.ctx.canvas.width  = window.innerWidth
    this.ctx.canvas.height = window.innerHeight
    this.size = { x: window.innerWidth, y: window.innerHeight }
  }
  
  toggle_pause() {
    paused = !paused
  }
}

class Keyboarder {
  constructor() {
    this.key_states = {}
    this.functions = {}

    window.addEventListener("keydown", event => {
      if (this.key_states[event.keyCode] == "released" || this.key_states[event.keyCode] == null) {
        this.key_states[event.keyCode] = "pressed"
        if (this.functions[event.keyCode] != null) {
          this.functions[event.keyCode]()
        }
      }
    })

    window.addEventListener("keyup", event => {
      if (this.key_states[event.keyCode] == "pressed") {
        this.key_states[event.keyCode] = "released"
      }
    })
  }

  on_press(keyCode, fn) {
    this.functions[keyCode] = fn
  }
}

class CollisionObject {
  
  constructor() {
  }
  
}

class CollisionCircle extends CollisionObject{
  
  constructor(demo, radius, center, move_vector, angle, spin, color, name) {
    super()
    this.demo = demo
    this.radius = radius
    this.center = {x: center.x, y: center.y}
    this.move_vector = {x: move_vector.x, y: move_vector.y}
    this.angle = angle
    this.spin = spin
    this.color = color
    this.name = name
    demo.collision_objects.push(this)
  }
  
  update(){
    this.name_size = calculate_font_size(this.demo, 15)
    if (this.center.x > this.demo.size.x-this.radius){
      this.move_vector.x = -Math.abs(this.move_vector.x)
    }
    else if (this.center.x < this.radius ) {
      this.move_vector.x = Math.abs(this.move_vector.x)
    }
    if (this.center.y > this.demo.size.y-this.radius){
      this.move_vector.y = -Math.abs(this.move_vector.y)
    }
    else if (this.center.y < this.radius ) {
      this.move_vector.y = Math.abs(this.move_vector.y)
    }
    this.center.x += this.move_vector.x
    this.center.y += this.move_vector.y
    this.angle += this.spin
  }
  
  draw(){
    this.demo.ctx.beginPath()
    this.demo.ctx.strokeStyle = this.color
    this.demo.ctx.lineWidth = Math.max(1,Math.min(this.demo.size.x, this.demo.size.y)/100)
    this.demo.ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2, true)
    this.demo.ctx.stroke()
    this.demo.ctx.fillStyle = this.color
    this.demo.ctx.font = String(this.name_size) + "pt sans-serif"
    this.demo.ctx.textAlign = "center"
    this.demo.ctx.fillText(this.name, this.center.x, this.center.y+0.5*this.name_size)
  }
}

class CollisionLineSegment extends CollisionObject{
  
  constructor(demo, length, center, move_vector, angle, spin, color, name1, name2) {
    super()
    this.demo = demo
    this.length = length
    this.center = {x: center.x, y: center.y}
    this.move_vector = {x: move_vector.x, y: move_vector.y}
    this.angle = angle
    this.spin = spin
    this.color = color
    this.endpoints = [{"name": name1,
                       "x": this.center.x + Math.cos(this.angle)*this.length/2,
                       "y": this.center.y + Math.sin(this.angle)*this.length/2},
                      {"name": name2,
                       "x": this.center.x - Math.cos(this.angle)*this.length/2,
                       "y": this.center.y - Math.sin(this.angle)*this.length/2}
                     ]
    demo.collision_objects.push(this)
  }
  
  update(){
    this.name_size = calculate_font_size(this.demo, 15)
    this.center.x += this.move_vector.x
    this.center.y += this.move_vector.y
    this.angle += this.spin
    this.update_endpoints()
    this.update_move_vector(this.endpoints)
    this.update_spin(this.endpoints)
  }
  
  update_endpoints(){
    this.endpoints[0]["x"] = this.center.x + Math.cos(this.angle)*this.length/2
    this.endpoints[0]["y"] = this.center.y + Math.sin(this.angle)*this.length/2
    this.endpoints[1]["x"] = this.center.x - Math.cos(this.angle)*this.length/2
    this.endpoints[1]["y"] = this.center.y - Math.sin(this.angle)*this.length/2
  }
  
  update_move_vector(endpoints){
    endpoints.forEach( endpoint => {
      if (endpoint["x"] > this.demo.size.x){
        this.move_vector.x = -Math.abs(this.move_vector.x)
        this.spin = -this.spin
      }
      else if (endpoint["x"] < 0) {
        this.move_vector.x = Math.abs(this.move_vector.x)
        this.spin = -this.spin
      }
      if (endpoint["y"] > this.demo.size.y){
        this.move_vector.y = -Math.abs(this.move_vector.y)
        this.spin = -this.spin
      }
      else if (endpoint["y"] < 0) {
        this.move_vector.y = Math.abs(this.move_vector.y)
        this.spin = -this.spin
      }
    })
  }
  
  update_spin(endpoints){
  }
  
  draw(){
    this.demo.ctx.beginPath()
    this.demo.ctx.strokeStyle = this.color
    this.demo.ctx.lineWidth = Math.max(1,Math.min(this.demo.size.x, this.demo.size.y)/100)
    this.demo.ctx.moveTo(this.endpoints[0]["x"], this.endpoints[0]["y"])
    this.demo.ctx.lineTo(this.endpoints[1]["x"], this.endpoints[1]["y"])
    this.demo.ctx.stroke()
    this.demo.ctx.fillStyle = this.color
    this.demo.ctx.font = String(this.name_size) + "pt sans-serif"
    this.demo.ctx.textAlign = "center"
    this.demo.ctx.fillText(this.endpoints[0]["name"], this.endpoints[0]["x"], this.endpoints[0]["y"]+0.5*this.name_size)
    this.demo.ctx.fillText(this.endpoints[1]["name"], this.endpoints[1]["x"], this.endpoints[1]["y"]+0.5*this.name_size)
  }
}

class CollisionVisualization {
  
  constructor(demo) {
    this.demo = demo
    this.calculate()
  }
  
  calculate() {
    this.bc_vector = Vector2d.points_to_vector({x: this.demo.line_b.endpoints["0"]["x"],
                                                y: this.demo.line_b.endpoints["0"]["y"]},
                                               {x: this.demo.line_b.endpoints["1"]["x"],
                                                y: this.demo.line_b.endpoints["1"]["y"]})                         
    this.ba_vector = Vector2d.points_to_vector({x: this.demo.line_b.endpoints["0"]["x"],
                                                y: this.demo.line_b.endpoints["0"]["y"]},
                                               this.demo.circle_a.center)
    this.bd_vector = this.ba_vector.project(this.bc_vector)
    this.point_d = {x: this.demo.line_b.endpoints["0"]["x"] + this.bd_vector.x,
                    y: this.demo.line_b.endpoints["0"]["y"] + this.bd_vector.y}
    this.ac_vector = Vector2d.points_to_vector(this.demo.circle_a.center,
                                               {x: this.demo.line_b.endpoints["1"]["x"],
                                                y: this.demo.line_b.endpoints["1"]["y"]})
    this.ad_vector = Vector2d.points_to_vector(this.demo.circle_a.center,
                                               this.point_d)
    
    this.colliding = false
    this.case1 = this.case2 = this.case3 = ""
    if (this.bd_vector.length() > this.demo.line_b.length) {
              this.case1 = " • "
              if (this.ac_vector.length() < this.demo.circle_a.radius) {this.colliding = true}
    } else if (this.bc_vector.dot(this.ba_vector) < 0) {
              this.case2 = " • "
              if (this.ba_vector.length() < this.demo.circle_a.radius) {this.colliding = true}
    } else {
              this.case3 = " • "
              if (this.ad_vector.length() < this.demo.circle_a.radius) {this.colliding = true}
    }
  }
  
  set_visualization_color() {
    if (this.colliding) {this.color = COLLISION_TRUE}
    else {this.color = COLLISION_FALSE}
  }
  
  multi_line_text(text_array, color, font_size_denominator) {
    var font_size = calculate_font_size(this.demo, font_size_denominator)
    var text_y = this.demo.size.y - 0.5*font_size
    for (var i = text_array.length-1; i > -1; i--) { 
      this.demo.ctx.fillStyle = color
      this.demo.ctx.font = String(font_size) + "pt sans-serif"
      this.demo.ctx.textAlign = "left"
      this.demo.ctx.fillText(text_array[i], 0.5*font_size, text_y)
      text_y -= 1.6*font_size
    }
  }
  
  update() {
    this.label_size = calculate_font_size(this.demo, 15)
    this.calculate()
    this.set_visualization_color()
  }
  
  draw() {
    this.demo.ctx.beginPath()
    this.demo.ctx.strokeStyle = this.color
    this.demo.ctx.lineWidth = Math.max(1,Math.min(this.demo.size.x, this.demo.size.y)/100)
    this.demo.ctx.moveTo(this.demo.circle_a.center.x, this.demo.circle_a.center.y)
    this.demo.ctx.lineTo(this.demo.line_b.endpoints["0"]["x"], this.demo.line_b.endpoints["0"]["y"])
    this.demo.ctx.stroke()
    
    this.demo.ctx.beginPath()
    this.demo.ctx.setLineDash([10, 5])
    this.demo.ctx.moveTo(this.demo.line_b.endpoints["0"]["x"], this.demo.line_b.endpoints["0"]["y"])
    this.demo.ctx.lineTo(this.point_d.x, this.point_d.y)
    this.demo.ctx.stroke()
    
    this.demo.ctx.beginPath()
    this.demo.ctx.setLineDash([10, 5])
    this.demo.ctx.moveTo(this.point_d.x, this.point_d.y)
    this.demo.ctx.lineTo(this.demo.circle_a.center.x, this.demo.circle_a.center.y)
    this.demo.ctx.stroke()
    
    this.demo.ctx.beginPath()
    this.demo.ctx.setLineDash([10, 5])
    this.demo.ctx.moveTo(this.demo.line_b.endpoints["1"]["x"], this.demo.line_b.endpoints["1"]["y"])
    this.demo.ctx.lineTo(this.demo.circle_a.center.x, this.demo.circle_a.center.y)
    this.demo.ctx.stroke()
    
    this.demo.ctx.fillStyle = this.color
    this.demo.ctx.font = String(this.label_size) + "pt sans-serif"
    this.demo.ctx.textAlign = "center"
    this.demo.ctx.fillText("D", this.point_d.x, this.point_d.y + 0.5 * this.label_size)
    
    this.demo.ctx.setLineDash([])
    
    
    this.multi_line_text([
      "BD is BA projected onto BC",
      this.case1 + "length of BD: "+ Math.round(this.bd_vector.length()).toString(),
      this.case1 + "BD longer than BC: " + (this.bd_vector.length() > this.demo.line_b.length),
      this.case1 + "length of AC: "+ Math.round(this.ac_vector.length()).toString(),
      this.case1 + "AC shorter than radius of A: " + (this.ac_vector.length() < this.demo.circle_a.radius),
      this.case2 + "BA dot product BC negative: " + (this.bc_vector.dot(this.ba_vector) < 0),
      this.case2 + "length of BA: "+ Math.round(this.ba_vector.length()).toString(),
      this.case2 + "BA shorter than radius of A: " + (this.ba_vector.length() < this.demo.circle_a.radius),
      this.case3 + "length of AD: "+ Math.round(this.ad_vector.length()).toString(),
      this.case3 + "AD shorter than radius of A: " + (this.ad_vector.length() < this.demo.circle_a.radius),
      "collision detected: " + this.colliding
                         ], this.color, 30)
  }
}

class Vector2d {
  
  constructor(x, y) {
    this.x = x
    this.y = y
  }
  
  static points_to_vector(start, end) {
    return new Vector2d(end.x-start.x,end.y-start.y)
  }
  
  dot(other) {
    return this.x * other.x + this.y * other.y
  }
  
  project(other) {
    let multiplier = (this.dot(other)/other.dot(other))
    return new Vector2d(other.x*multiplier, other.y*multiplier)
  }
  
  length() {
    return (Math.sqrt(this.x*this.x + this.y*this.y))
  }
}

function calculate_font_size(demo, denominator) {
  return Math.min(demo.size.x, demo.size.y)/denominator
}

function start_demo() {
  const demo = new Demo(document.getElementById("js-canvas"))
}

document.addEventListener("DOMContentLoaded", start_demo)
