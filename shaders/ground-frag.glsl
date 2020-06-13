precision highp float;

uniform sampler2D u_earth_texture;

varying highp vec3 v_color;
varying highp vec3 v_attenuate;
varying highp vec2 v_texcoord;

void main()
{
	vec3 earth = texture2D(u_earth_texture, v_texcoord).rgb;
	gl_FragColor = vec4(v_color + earth * v_attenuate, 1.0);
}