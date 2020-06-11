precision highp float;

varying highp vec2 v_texcoord;

uniform sampler2D u_sampler;

void main(void) {
	vec4 color = texture2D(u_sampler, v_texcoord);
	gl_FragColor = color;
}