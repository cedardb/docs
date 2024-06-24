document.addEventListener('DOMContentLoaded', () => {
    // Add a click event on various child elements to close the parent modal
    (document.querySelectorAll('.editor-toggle') || []).forEach(($codebutton) => {
        $codebutton.addEventListener('click', () => {
            const editorbox = document.querySelector('#editorbox-' + $codebutton.getAttribute("data-target"))
            const codebox = document.querySelector('#codebox-' + $codebutton.getAttribute("data-target"));

            if (editorbox.classList.contains('hidden')) {
                editorbox.querySelector(".query-start").classList.remove("hidden");
                editorbox.querySelector(".query-stop").classList.add("hidden");
                editorbox.querySelector(".result-placeholder").classList.remove("hidden");
                editorbox.querySelector(".progress").classList.add("hidden");
                editorbox.querySelector(".result-wrapper").classList.add("hidden");
                $(editorbox.querySelector(".result-table")).empty();


            }

            $(editorbox).toggleClass("hidden");
            $(codebox).toggleClass("hidden");
            var editor = ace.edit('editor-' + $codebutton.getAttribute("data-target"));
            theme = document.documentElement.classList.contains("dark") ? "dark" : "light"
            
            if (theme == "dark") {
                editor.setTheme("ace/theme/github_dark");
            } else {
                editor.setTheme("ace/theme/github");   
            }

            editor.session.setMode("ace/mode/sql");
            var sql = $(codebox.querySelector(".sql-code-code")).text().trim();


            editor.setValue(sql + "\n");
            editor.setOption("maxLines", 20);
            editor.setOption("minLines", 5);
            editor.clearSelection();
        });
    });

    buildTable = ($element, columns, values, numRows) => {
        $($element).empty();
        $header = $("<tr>");
        $.each(columns, (index, column) => {
            $header.append($("<th>").text(column.name));
        });
        $($element).append($header);
        for (i = 0; i < numRows; i++) {
            $rowDiv = $("<tr>");
            $.each(columns, (col_index, val) => {
                $rowDiv.append($("<td>").text(values[col_index][i]));
            });
            $($element).append($rowDiv);
        }
    };

    formatTime = (duration) => {
        if ((duration * 1000) < 1) {
            val = duration * 1000 * 1000;
            return val.toFixed(2) + "µs";
        }

        if ((duration) < 1) {
            val = duration * 1000;
            return val.toFixed(2) + "ms";
        }
        return duration.toFixed(2) + "s";
    }

    (document.querySelectorAll('.query-start') || []).forEach(($runbutton) => {
        $runbutton.addEventListener('click', () => {
            $runbutton.classList.add("hidden");
            $box = $runbutton.closest(".sql-editor-box");
            $box.querySelector(".query-stop").classList.remove("hidden");
            $box.querySelector(".result-placeholder").classList.add("hidden");
            $box.querySelector(".progress").classList.remove("hidden");
            $box.querySelector(".result-wrapper").classList.add("hidden");

            var editor = ace.edit('editor-' + $runbutton.getAttribute("data-target"));

            $.ajax(
                {
                    url: "https://umbra.db.in.tum.de/api/query",
                    method: "post",
                    crossDomain: true,
                    data: "set search_path = tpchSf1, public;\n" + editor.getValue(),
                    success: (data, status) => {
                        $runbutton.classList.remove("hidden");
                        $box.querySelector(".query-stop").classList.add("hidden");
                        $resultsWrapper = $box.querySelector(".result-wrapper");
                        $results = $box.querySelector(".result-table");
                        queryRes = data.results[0];

                        buildTable($results, queryRes.columns, queryRes.result, queryRes.resultCount);

                        $($resultsWrapper.querySelector(".rowcount")).text(queryRes.resultCount);
                        $($resultsWrapper.querySelector(".compiletime")).text(formatTime(queryRes.compilationTime));
                        $($resultsWrapper.querySelector(".executiontime")).text(formatTime(queryRes.executionTime));


                        $resultsWrapper.classList.remove("hidden");
                        $box.querySelector(".progress").classList.add("hidden");
                    },
                    error: (data) => {
                        $runbutton.classList.remove("hidden");
                        $box.querySelector(".query-stop").classList.add("hidden");
                        $box.querySelector(".progress").classList.add("hidden");
                        $results = $box.querySelector(".result-table");
                        $resultsWrapper = $box.querySelector(".result-wrapper");

                        $($results).empty();
                        $($results).append($("<b>").text("Error: " + data.responseJSON.exception));
                        $($results).append($("</br>"));
                        $($results).append($("<span>").text(data.responseJSON.details));
                        $resultsWrapper = $box.querySelector(".result-wrapper");
                        $resultsWrapper.classList.remove("hidden");
                    }
                }
            )
        });

    });

})
