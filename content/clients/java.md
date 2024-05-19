---
title: "Java"
linkTitle: "Java"
weight: 20
---

CedarDB is compatible with the [PostgreSQL JDBC](https://jdbc.postgresql.org/) driver.

## Installing

Before demonstrating the connection to CedarDB, we need to get the correct dependencies and set the classpath.
Note that you can simply [download](https://jdbc.postgresql.org/download/) the latest version of the JDBC.
```bash
wget https://jdbc.postgresql.org/download/postgresql-42.7.3.jar
```

After finishing the client (see at the full program at the bottom of the program), we need to first compile our java program with `javac` and then execute the class with the right classpath.
This examples assumes that the java program has the name `CedarDBClient`.
```bash
export CLASSPATH=".:postgresql-42.7.3.jar"
javac CedarDBClient.java
java CedarDBClient
```

## Connecting
Connect to CedarDB like this:
```Java
// The connection string
String jdbc = "jdbc:postgresql://localhost:5432/<dbname>";

// SSL properties (for example to connect with self-signed SSL)
// This will work out-of-the-box with our docker container)
Properties props = new Properties();
props.setProperty("user", "<username>");
props.setProperty("password", "<password>");
props.setProperty("ssl", "true");
props.setProperty("sslfactory", "org.postgresql.ssl.NonValidatingFactory");

// Check whether the driver is available
try {
    Class.forName("org.postgresql.Driver");
} catch (Exception e) {
    System.out.println("Failed to create JDBC db connection " + e.getMessage());
}

// Establishing a connection
try (Connection connection = DriverManager.getConnection(jdbc, props)) {
    System.out.println("Connected to the PostgreSQL server securely.");
} catch (Exception e) {
    // Handling any errors that occur during connection or execution
    System.err.println("Connection error: " + e.getMessage());
}
```
You now have an open connection to CedarDB that allows you to insert data or query the database.

## Inserting Data

Let's create a new table storing the log of a public chat channel:

```Java
Statement st = conn.createStatement();
st.execute("CREATE TABLE IF NOT EXISTS chatlog(userid integer, message text, ts timestamptz)");
st.close();
```
In the following, we insert a new tuple using the `conn` instance:

```Java
PreparedStatement ps = conn.prepareStatement("INSERT INTO chatlog VALUES (?, ?, ?)");
ps.setInt(1, 1);
ps.setString(2, "This is a message.");
java.sql.Date date = new Date();
ps.setTimestamp(3, new Timestamp(date.getTime()))
int rowsInserted = ps.executeUpdate();
System.out.println(rowsInserted + " rows inserted");
ps.close();
```

## Executing Queries

Let's read back all data we have inserted previously:

```Java
Statement statement = conn.createStatement();
ResultSet resultSet = statement.executeQuery("SELECT * FROM chatlog");
while (resultSet.next()) {
    int id = resultSet.getInt("userid");
    String message = resultSet.getString("message");
    String time = resultSet.getString("ts");

    System.out.println(id + ", " + message+ ", " + time);
}
resultSet.close();
statement.close();
```

## Bulk Loading
If you need to load a lot of data at once (e.g., for an initial import of your existing data set), inserting tuples one by one is too slow:
jdbc has to do a full roundtrip to CedarDB and back for each single insert, making the whole loading process severely network latency bound, even on a local connection.

Use jdbc's bulk loading feature instead:

```Java
StringBuffer csv = new StringBuffer(100000);
for (int i = 0; i < 100000; i++) {
    csv.append(i + "," + "This is a message!,2024-04-11 18:16:16.368000+00\n");
}
Reader inputString = new StringReader(csv.toString());
String sql = "COPY chatlog FROM stdin CSV DELIMITER ','";
CopyManager mgr = new CopyManager((BaseConnection) conn);
long rowsCopied = mgr.copyIn(sql, inputString);
System.out.println(rowsCopied + " rows inserted");
```

This feature makes use of CedarDB's Postgres-compatible `COPY` mode to bulk transmit all data, leading to significantly higher throughput:

```
LOG: 100000 rows (0.000033 s parsing, 0.001294 s compilation, 0.263479 s transmission, 0.049921 s execution)
```


## Source Code

{{% details title="Open to show the complete sample code" closed="true" %}}

```Java
import org.postgresql.copy.CopyManager;
import org.postgresql.core.BaseConnection;
import java.io.*;
import java.sql.*;
import java.util.Properties;

public class CedarDBClient {
    private static final String jdbc = "jdbc:postgresql://localhost:5432/<database>";

    public static void main(String[] args) {
        // SSL properties
        Properties props = new Properties();
        props.setProperty("user", "<username>");
        props.setProperty("password", "<password>");
        props.setProperty("ssl", "true");
        props.setProperty("sslfactory", "org.postgresql.ssl.NonValidatingFactory");

        // Establishing a connection
        try (Connection conn = DriverManager.getConnection(jdbc, props)) {
            System.out.println("Connected to the PostgreSQL server securely.");

            // Create table
            Statement st = conn.createStatement();
            st.execute("CREATE TABLE IF NOT EXISTS chatlog(userid integer, message text, ts timestamptz)");
            st.close();

            // Insert data
            PreparedStatement ps = conn.prepareStatement("INSERT INTO chatlog VALUES (?, ?, ?)");
            ps.setInt(1, 7);
            ps.setString(2, "(☞ﾟ∀ﾟ)☞");
            ps.setTimestamp(3, new Timestamp(System.currentTimeMillis()));
            int rowsInserted = ps.executeUpdate();
            System.out.println(rowsInserted + " rows inserted");
            ps.close();

            // Bulk insert
            StringBuffer csv = new StringBuffer(100000);
            for (int i = 0; i < 100000; i++) {
                csv.append(i + "," + "This is a message!,2024-04-11 18:16:16.368000+00\n");
            }
            Reader inputString = new StringReader(csv.toString());
            String sql = "COPY chatlog FROM stdin CSV DELIMITER ','";
            CopyManager mgr = new CopyManager((BaseConnection) conn);
            long rowsCopied = mgr.copyIn(sql, inputString);
            System.out.println(rowsCopied + " rows inserted");

            // Run query
            Statement statement = conn.createStatement();
            ResultSet resultSet = statement.executeQuery("SELECT * FROM chatlog ORDER BY userid LIMIT 10");
            while (resultSet.next()) {
                int id = resultSet.getInt("userid");
                String message = resultSet.getString("message");
                String time = resultSet.getString("ts");

                System.out.println(id + ", " + message+ ", " + time);
            }
            resultSet.close();
            statement.close();
        } catch (Exception e) {
            System.err.println("Connection error: " + e.getMessage());
        }
    }
}
```

{{% /details %}}
