precision highp float;

uniform sampler2D u_texture;
uniform lowp vec4 u_color;

varying highp vec2 v_texcoord;

void main()
{
	gl_FragColor = texture2D(u_texture, v_texcoord) * u_color;
}