attribute vec3 a_position;

uniform mat4 u_proj_matrix;
uniform mat4 u_view_matrix;

void main(void) {
	vec4 position = vec4(a_position, 1.0);
	gl_Position = u_proj_matrix * u_view_matrix * position;
}