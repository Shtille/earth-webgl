attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

uniform mat4 u_proj_matrix;
uniform mat4 u_view_matrix;

varying highp vec2 v_texcoord;

void main(void) {
	vec4 position = vec4(a_position, 1.0);
	gl_Position = u_proj_matrix * u_view_matrix * position;
	v_texcoord = a_texcoord;
}