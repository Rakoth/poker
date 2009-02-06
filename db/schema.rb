# This file is auto-generated from the current state of the database. Instead of editing this file, 
# please use the migrations feature of Active Record to incrementally modify your database, and
# then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your database schema. If you need
# to create the application database on another system, you should be using db:schema:load, not running
# all the migrations from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20090206182009) do

  create_table "blind_values", :id => false, :force => true do |t|
    t.integer "level"
    t.integer "value"
    t.integer "ante"
    t.integer "game_type_id"
  end

  create_table "game_types", :force => true do |t|
    t.string   "title"
    t.integer  "max_players"
    t.integer  "start_stack"
    t.decimal  "start_cash",        :precision => 10, :scale => 2
    t.decimal  "additional_cash",   :precision => 10, :scale => 2
    t.integer  "start_blind"
    t.integer  "change_level_time"
    t.string   "template"
    t.integer  "min_level"
    t.integer  "max_level"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "games", :force => true do |t|
    t.string   "status",          :default => "wait"
    t.integer  "turn",            :default => 0
    t.integer  "blind",           :default => 0
    t.integer  "blind_size"
    t.integer  "ante"
    t.integer  "blind_level",     :default => 0
    t.datetime "next_level_time"
    t.integer  "players_count",   :default => 0
    t.integer  "bank",            :default => 0
    t.integer  "type_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "players", :force => true do |t|
    t.integer  "sit"
    t.integer  "stack"
    t.string   "hand"
    t.datetime "action_time"
    t.datetime "our_action_time"
    t.integer  "action"
    t.integer  "user_id"
    t.integer  "game_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "sessions", :force => true do |t|
    t.string   "session_id", :null => false
    t.text     "data"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "sessions", ["session_id"], :name => "index_sessions_on_session_id"
  add_index "sessions", ["updated_at"], :name => "index_sessions_on_updated_at"

  create_table "user_balance_actions", :id => false, :force => true do |t|
    t.integer  "user_id"
    t.string   "direction"
    t.float    "value"
    t.string   "comment"
    t.datetime "created_at"
  end

  create_table "user_infos", :force => true do |t|
    t.string   "name"
    t.string   "country"
    t.date     "birthday"
    t.string   "language"
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "users", :force => true do |t|
    t.string   "login"
    t.string   "crypted_password"
    t.string   "salt"
    t.integer  "type"
    t.string   "email"
    t.decimal  "cash",             :precision => 10, :scale => 2, :default => 0.0
    t.integer  "chips",                                           :default => 1000
    t.integer  "level",                                           :default => 0
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
