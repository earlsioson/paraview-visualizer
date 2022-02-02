from trame import controller as ctrl
from trame.html import Div, vuetify
from pv_visualizer.html import pipeline
from pv_visualizer.html import proxy_editor


def on_reload(reload_modules):
    reload_modules(pipeline, proxy_editor)


# -----------------------------------------------------------------------------
# UI module
# -----------------------------------------------------------------------------

NAME = "pipeline"
ICON = "mdi-source-branch"
ICON_STYLE = {"style": "transform: scale(1, -1);"}

COMPACT = {
    "dense": True,
    "hide_details": True,
}

TOP_ICONS = [
    {"icon": "mdi-source-branch", "kwargs": ICON_STYLE},
    {"icon": "mdi-palette", "kwargs": {}},
    {"icon": "mdi-clock-outline", "kwargs": {}},
    {"icon": "mdi-format-list-bulleted-type", "kwargs": {}},
]


def create_panel(container):
    with container:
        with vuetify.VCol(
            v_if=(f"active_controls == '{NAME}'",),
            dense=True,
            classes="pa-0 ma-0 fill-height",
        ):
            with vuetify.VToolbar(
                dense=True,
                outlined=True,
                classes="pa-0 ma-0",
            ):
                with vuetify.VTabs(
                    v_model=("pipeline_elem", 0),
                    **COMPACT,
                    outlined=True,
                    rounded=True,
                    required=True,
                ):
                    for item in TOP_ICONS:
                        with vuetify.VTab(
                            classes="px-0 mx-0", style="min-width: 40px;", **COMPACT
                        ):
                            vuetify.VIcon(item.get("icon"), **item.get("kwargs"))

                vuetify.VSpacer()
                with vuetify.VBtn(
                    small=True, icon=True, click="show_pipeline = !show_pipeline"
                ):
                    vuetify.VIcon("mdi-unfold-less-horizontal", v_if=("show_pipeline",))
                    vuetify.VIcon(
                        "mdi-unfold-more-horizontal", v_if=("!show_pipeline",)
                    )

            with Div(style="height: 33vh;", v_if=("show_pipeline", 1)):
                pipeline_browser = pipeline.PipelineBrowser(
                    v_show=("pipeline_elem === 0",),
                    width=container.width,
                )
                ctrl.pipeline_update = pipeline_browser.update

            # editor part
            proxy_editor.ProxyEditor(v_if=(f"pipeline_elem === 0",))
